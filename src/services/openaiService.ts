
import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client.ts';
import { AIProviderService } from './AIProviderService';
import { DetailedLogger } from './DetailedLogger';
import { getTableNameForChannelSync } from '@/utils/channelMapping';
import { AIProvider, ProviderType } from '@/types/ai-providers';

// Tipos básicos para mensagens e conversas
interface ConversationMessage {
  id: string;
  message: string;
  nome_do_contato?: string | null;
  session_id: string;
  tipo_remetente: 'customer' | 'agent' | 'USUARIO_INTERNO' | 'Yelena-ai' | 'CONTATO_EXTERNO' | string;
  created_at: string; 
  mensagemtype?: string | null;
  media_url?: string | null;
  media_caption?: string | null;
  is_read?: boolean | null;
}

// Removed local AIProvider interface, will use imported one

const MAX_PROMPT_MESSAGES = 20;

export const openaiService = {
  async getOpenAIInstance(providerType: ProviderType | string = 'openai'): Promise<OpenAI | null> {
    DetailedLogger.info('OpenAIService', `Buscando provedor OpenAI ativo... Tipo: ${providerType}`);
    try {
      // Tentar obter userId global + individual, se hook de contexto disponível
      let userId: string | undefined = undefined;
      // Tentativa de buscar userId do contexto está fora deste arquivo
      // Por simplicidade, consulta ambos (global e usuário) como no serviço acima

      const activeProvidersResult = await AIProviderService.getProviders(userId);

      let provider: AIProvider | null | undefined = null;

      if (Array.isArray(activeProvidersResult)) {
        console.log('[OpenAIService] Lista de provedores disponíveis:', activeProvidersResult.map(p => `${p.name} (${p.provider_type}) ativo=${p.is_active}, user_id=${p.user_id}`));
        provider = activeProvidersResult.find(
          p => p.provider_type === providerType && p.is_active === true
        );
        if (!provider) {
          DetailedLogger.warn(
            'OpenAIService',
            `Nenhum provedor OpenAI ativo encontrado para o tipo '${providerType}'.`
          );
        }
      } else if (activeProvidersResult && typeof activeProvidersResult === 'object') {
        provider = (activeProvidersResult as AIProvider);
        if (
          provider.provider_type === providerType &&
          provider.is_active === true
        ) {
          // Ok
        } else {
          provider = null;
        }
      }

      if (provider && provider.api_key) {
        DetailedLogger.info(
          'OpenAIService',
          `Provedor OpenAI '${provider.name}' encontrado. BaseURL: ${provider.base_url || 'Padrão OpenAI'}`
        );
        return new OpenAI({
          apiKey: provider.api_key,
          baseURL: provider.base_url || undefined,
          dangerouslyAllowBrowser: true,
        });
      }
      DetailedLogger.warn('OpenAIService', `Provedor OpenAI não encontrado ou chave de API não configurada. Resultado da busca:`, provider);
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
        model: 'gpt-3.5-turbo', 
        messages: [
          { role: 'system', content: 'Você é um assistente útil que resume conversas.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
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
    const tableName = getTableNameForChannelSync(channelId);
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
        .order('read_at', { ascending: true }); // TROCA AQUI

      if (error) {
        DetailedLogger.error('OpenAIService', `Erro ao buscar mensagens da tabela '${tableName}':`, error);
        throw error;
      }
      
      const typedData: ConversationMessage[] = (data || []).map((item: any): ConversationMessage => ({
        id: String(item.id), // Ensure id is string
        message: item.message || '',
        nome_do_contato: item.nome_do_contato,
        session_id: item.session_id,
        tipo_remetente: item.tipo_remetente || 'unknown',
        created_at: item.read_at || new Date().toISOString(), // read_at vira created_at no contexto deste service
        mensagemtype: item.mensagemtype,
        media_url: item.media_url || item.media_base64, // Handle both possible media fields
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
      // Permitir resposta com mensagem padrão mesmo se vazio
      return 'Nenhuma mensagem disponível nesta conversa.';
    }

    // O contexto completo da conversa
    const contactName = messages[0]?.nome_do_contato || 'Cliente';
    // Encontra a última mensagem do cliente (customer ou CONTATO_EXTERNO)
    const lastMsgCliente = [...messages].reverse().find(
      m => m.tipo_remetente === 'customer' || m.tipo_remetente === 'CONTATO_EXTERNO'
    );
    const lastMsgClienteTexto = lastMsgCliente?.message || messages[messages.length - 1].message || '';

    // Prompt considera todo o histórico (máx 50) e pede resposta para a última do cliente
    let prompt = `Você é um assistente de atendimento ao cliente.\n`;
    prompt += `Baseando-se em todo o histórico da conversa abaixo, sugira uma resposta apropriada, breve e profissional para a ÚLTIMA mensagem enviada pelo cliente.\n\n`;
    if (customInstructions) {
      prompt += `Instruções adicionais: ${customInstructions}\n\n`;
    }
    prompt += 'Histórico da Conversa:\n';
    messages.slice(-50).forEach(msg => {
      const sender = msg.tipo_remetente === 'customer' || msg.tipo_remetente === 'CONTATO_EXTERNO'
        ? (msg.nome_do_contato || contactName)
        : 'Atendente';
      prompt += `${sender}: ${msg.message}\n`;
    });
    prompt += `\nResponder a seguinte mensagem do cliente:\n"${lastMsgClienteTexto}"\nResposta:\n`;

    try {
      DetailedLogger.info('OpenAIService', 'Enviando requisição de sugestão de resposta para OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
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
