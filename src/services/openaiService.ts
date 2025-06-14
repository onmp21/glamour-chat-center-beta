import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { AIProviderService } from './AIProviderService';
import { DetailedLogger } from './DetailedLogger';
import { getTableNameFromChannelId } from '@/utils/channelMapping'; // Assuming this utility exists

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

const MAX_PROMPT_MESSAGES = 20; // Limite de mensagens para incluir no prompt

export const openaiService = {
  async getOpenAIInstance(providerType: 'openai' | string = 'openai'): Promise<OpenAI | null> {
    DetailedLogger.info('OpenAIService', `Buscando provedor OpenAI ativo... Tipo: ${providerType}`);
    try {
      const provider = await AIProviderService.getActiveProviderByType(providerType);
      if (provider && provider.api_key) {
        DetailedLogger.info('OpenAIService', `Provedor OpenAI '${provider.name}' encontrado. BaseURL: ${provider.base_url || 'Padrão OpenAI'}`);
        return new OpenAI({
          apiKey: provider.api_key,
          baseURL: provider.base_url || undefined, // Usar undefined para o padrão da OpenAI se não houver baseURL
          dangerouslyAllowBrowser: true, // Permitir uso no navegador (idealmente, isso seria no backend)
        });
      }
      DetailedLogger.warn('OpenAIService', 'Nenhum provedor OpenAI ativo ou chave de API não configurada.');
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
    const tableName = getTableNameFromChannelId(channelId);
    if (!tableName) {
      DetailedLogger.error('OpenAIService', `Nome de tabela inválido para channelId: ${channelId}`);
      return [];
    }
    DetailedLogger.info('OpenAIService', `Buscando mensagens da tabela '${tableName}' para conversa ${conversationId}`);

    try {
      const { data, error } = await supabase
        .from(tableName as any) // Cast to any to allow dynamic table name
        .select('*')
        .eq('session_id', conversationId)
        .order('created_at', { ascending: true }); // ou 'id' se 'created_at' não existir consistentemente

      if (error) {
        DetailedLogger.error('OpenAIService', `Erro ao buscar mensagens da tabela '${tableName}':`, error);
        throw error;
      }
      
      // Manually map to ConversationMessage[], as 'data' will be 'any[]' due to the cast.
      // This assumes the columns in the dynamic table are compatible with ConversationMessage.
      const typedData = (data || []).map((item: any): ConversationMessage => ({
        id: String(item.id), // Ensure ID is a string
        message: item.message || '',
        nome_do_contato: item.nome_do_contato,
        session_id: item.session_id,
        tipo_remetente: item.tipo_remetente || 'unknown',
        created_at: item.created_at || new Date().toISOString(),
        mensagemtype: item.mensagemtype,
        media_url: item.media_url || item.media_base64, // Prefer media_url, fallback to media_base64
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
  
  // ... (outras funções como generateSuggestedReply, analyzeSentiment podem ser adicionadas aqui)
};
