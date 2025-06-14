
import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { AIProviderService } from './AIProviderService';
import { DetailedLogger } from './DetailedLogger';
import { getTableNameForChannel } from '@/utils/channelMapping'; // Corrected import

// Tipos básicos para mensagens e conversas
interface ConversationMessage {
  id: string;
  message: string;
  nome_do_contato?: string | null;
  session_id: string;
  tipo_remetente: 'customer' | 'agent' | 'USUARIO_INTERNO' | 'Yelena-ai' | 'CONTATO_EXTERNO' | string; // string para flexibilidade
  created_at: string; // ou Date
  mensagemtype?: string | null;
  media_url?: string | null;
  media_caption?: string | null;
  is_read?: boolean | null;
}

// Define AIProvider type based on table structure
interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  api_key: string;
  base_url?: string | null;
  default_model?: string | null;
  is_active?: boolean | null; // is_active can be boolean or null
  // Add other fields from your ai_providers table as needed
  advanced_settings?: any; // Use 'any' or a more specific type for jsonb
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}


const MAX_PROMPT_MESSAGES = 20; // Limite de mensagens para incluir no prompt

export const openaiService = {
  async getOpenAIInstance(providerType: 'openai' | string = 'openai'): Promise<OpenAI | null> {
    DetailedLogger.info('OpenAIService', `Buscando provedor OpenAI ativo... Tipo: ${providerType}`);
    try {
      const activeProvidersResult = await AIProviderService.getActiveProviders(); // Should return AIProvider[] | AIProvider | null
      
      let provider: AIProvider | null | undefined = null;

      if (Array.isArray(activeProvidersResult)) {
        provider = activeProvidersResult.find(p => p.provider_type === providerType && p.is_active === true);
      } else if (activeProvidersResult && typeof activeProvidersResult === 'object') {
        // activeProvidersResult is a single AIProvider object
        if (activeProvidersResult.provider_type === providerType && activeProvidersResult.is_active === true) {
          provider = activeProvidersResult;
        }
      }
      
      if (provider && provider.api_key) {
        DetailedLogger.info('OpenAIService', `Provedor OpenAI '${provider.name}' encontrado. BaseURL: ${provider.base_url || 'Padrão OpenAI'}`);
        return new OpenAI({
          apiKey: provider.api_key,
          baseURL: provider.base_url || undefined,
          dangerouslyAllowBrowser: true,
        });
      }
      DetailedLogger.warn('OpenAIService', `Nenhum provedor OpenAI ativo do tipo '${providerType}' ou chave de API não configurada.`);
      return null;
    } catch (error) {
      DetailedLogger.error('OpenAIService', 'Erro ao obter instância OpenAI:', error);
      return null;
    }
  },

  async generateConversationSummary(
    channelId: string,
    conversationId: string,
    customInstructions?: string
  ): Promise<string> {
    DetailedLogger.info('OpenAIService', `Gerando resumo para canal ${channelId}, conversa ${conversationId}`);
    const openai = await this.getOpenAIInstance();
    if (!openai) {
      DetailedLogger.error('OpenAIService', 'Instância OpenAI não disponível para resumo.');
      throw new Error('OpenAI não configurado.');
    }

    const messages = await this.getMessagesForConversation(channelId, conversationId);
    if (messages.length === 0) {
      DetailedLogger.info('OpenAIService', 'Nenhuma mensagem encontrada para resumir.');
      return 'Não há mensagens nesta conversa para resumir.';
    }

    const contactName = messages[0]?.nome_do_contato || conversationId;
    let prompt = `Resuma a seguinte conversa com ${contactName}. Destaque os pontos principais e quaisquer ações pendentes. Seja conciso e direto.\n\n`;
    if (customInstructions) {
      prompt += `Instruções adicionais: ${customInstructions}\n\n`;
    }
    prompt += 'Conversa:\n';

    messages.slice(-MAX_PROMPT_MESSAGES).forEach(msg => {
      const sender = msg.tipo_remetente === 'customer' || msg.tipo_remetente === 'CONTATO_EXTERNO' ? (msg.nome_do_contato || 'Cliente') : 'Atendente';
      prompt += `${sender}: ${msg.message}\n`;
    });

    try {
      DetailedLogger.info('OpenAIService', 'Enviando requisição de resumo para OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Ou um modelo configurável
        messages: [
          { role: 'system', content: 'Você é um assistente útil que resume conversas.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200, // Ajustar conforme necessário
      });

      const summary = completion.choices[0]?.message?.content?.trim();
      if (summary) {
        DetailedLogger.info('OpenAIService', 'Resumo gerado com sucesso.');
        return summary;
      } else {
        DetailedLogger.warn('OpenAIService', 'OpenAI retornou um resumo vazio.');
        return 'Não foi possível gerar o resumo.';
      }
    } catch (error) {
      DetailedLogger.error('OpenAIService', 'Erro ao chamar API da OpenAI para resumo:', error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`Erro da API OpenAI: ${error.status} ${error.name} ${error.message}`);
      }
      throw new Error('Falha ao gerar resumo da conversa.');
    }
  },

  async getMessagesForConversation(
    channelId: string,
    conversationId: string
  ): Promise<ConversationMessage[]> {
    const tableName = getTableNameForChannel(channelId);
    if (!tableName) {
      DetailedLogger.error('OpenAIService', `Nome de tabela inválido para channelId: ${channelId}`);
      return [];
    }
    DetailedLogger.info('OpenAIService', `Buscando mensagens da tabela '${tableName}' para conversa ${conversationId}`);

    try {
      const { data, error } = await supabase
        .from(tableName as any) 
        .select('*')
        .eq('session_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        DetailedLogger.error('OpenAIService', `Erro ao buscar mensagens da tabela '${tableName}':`, error);
        throw error;
      }
      
      const typedData: ConversationMessage[] = (data || []).map((item: any): ConversationMessage => ({
        id: String(item.id),
        message: item.message || '',
        nome_do_contato: item.nome_do_contato,
        session_id: item.session_id,
        tipo_remetente: item.tipo_remetente || 'unknown',
        created_at: item.created_at || new Date().toISOString(),
        mensagemtype: item.mensagemtype,
        media_url: item.media_url || item.media_base64,
        media_caption: item.media_caption,
        is_read: item.is_read,
      }));

      DetailedLogger.info('OpenAIService', `Mensagens encontradas para ${conversationId} em ${tableName}: ${typedData.length}`);
      return typedData;

    } catch (error) {
      DetailedLogger.error('OpenAIService', `Exceção ao buscar mensagens para ${conversationId} em ${tableName}:`, error);
      return [];
    }
  },
  
  async generateSuggestedResponse(
    channelId: string,
    conversationId: string,
    customInstructions?: string
  ): Promise<string> {
    DetailedLogger.info('OpenAIService', `Gerando resposta sugerida para canal ${channelId}, conversa ${conversationId}`);
    const openai = await this.getOpenAIInstance();
    if (!openai) {
      DetailedLogger.error('OpenAIService', 'Instância OpenAI não disponível para resposta sugerida.');
      throw new Error('OpenAI não configurado.');
    }

    const messages = await this.getMessagesForConversation(channelId, conversationId);
    if (messages.length === 0) {
      DetailedLogger.info('OpenAIService', 'Nenhuma mensagem na conversa para gerar sugestão.');
      return 'Não há mensagens suficientes para gerar uma sugestão.';
    }

    const contactName = messages[0]?.nome_do_contato || 'Cliente';
    let prompt = `Você é um assistente de atendimento. Com base no histórico da conversa com ${contactName}, sugira uma resposta apropriada para a última mensagem do cliente. Seja breve e útil.\n\n`;
    if (customInstructions) {
      prompt += `Instruções adicionais: ${customInstructions}\n\n`;
    }
    prompt += 'Histórico da Conversa (mais recentes primeiro):\n';

    messages.slice(-5).reverse().forEach(msg => { // Pega as últimas 5 mensagens
      const senderPrefix = msg.tipo_remetente === 'customer' || msg.tipo_remetente === 'CONTATO_EXTERNO' ? `${contactName}:` : 'Atendente:';
      prompt += `${senderPrefix} ${msg.message}\n`;
    });
    
    prompt += `\nSugira uma resposta para a última mensagem de ${messages[messages.length -1].tipo_remetente === 'customer' || messages[messages.length -1].tipo_remetente === 'CONTATO_EXTERNO' ? contactName : 'Atendente'}:`;

    try {
      DetailedLogger.info('OpenAIService', 'Enviando requisição de sugestão de resposta para OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Ou um modelo configurável
        messages: [
          { role: 'system', content: 'Você é um assistente prestativo que sugere respostas em um chat de atendimento.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 100, 
        temperature: 0.7,
      });

      const suggestedResponse = completion.choices[0]?.message?.content?.trim();
      if (suggestedResponse) {
        DetailedLogger.info('OpenAIService', 'Resposta sugerida gerada com sucesso.');
        return suggestedResponse;
      } else {
        DetailedLogger.warn('OpenAIService', 'OpenAI retornou uma sugestão vazia.');
        return 'Não foi possível gerar uma sugestão no momento.';
      }
    } catch (error) {
      DetailedLogger.error('OpenAIService', 'Erro ao chamar API da OpenAI para sugestão de resposta:', error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`Erro da API OpenAI: ${error.status} ${error.name} ${error.message}`);
      }
      throw new Error('Falha ao gerar sugestão de resposta.');
    }
  }
};

