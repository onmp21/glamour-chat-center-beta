// @ts-nocheck
// TODO: Postgrest Builder needs to be fixed, it's failing to build because of a type error where a PostgrestFilterBuilder is expected, but a PostgrestQueryBuilder is returned.
// TODO: All supabase.from calls need to be fixed to use the correct table names, not strings.
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { N8nMessagingService } from './N8nMessagingService';
import { DetailedLogger } from './DetailedLogger';
import { Buffer } from 'buffer';
import { ChannelService } from './ChannelService'; // Import ChannelService
import { getTableNameForChannel } from '@/utils/channelMapping'; // Changed import

// Tipos para mensagens
type MessageType = 'text' | 'media';
type MediaType = 'image' | 'audio' | 'video' | 'document';

interface SendMessageParams {
  channelId: string;
  phoneNumber: string;
  message: string;
  messageType?: MessageType;
  mediaUrl?: string; // Para mensagens de mídia
  mediaType?: MediaType; // Tipo de mídia
  caption?: string; // Legenda para mídia
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ConnectionStatusResult {
  success: boolean;
  connected: boolean;
  instanceName?: string;
  error?: string;
}

export class EvolutionMessageService {
  private static instances: Map<string, any> = new Map();

  private static async getInstanceConfig(channelId: string): Promise<{ apiKey: string; baseUrl: string; instanceName: string } | null> {
    DetailedLogger.info('EvolutionMessageService', `Buscando configuração da instância para o canal: ${channelId}`);
    try {
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .select(`
          api_instance_id,
          api_instances (
            api_key,
            base_url,
            instance_name
          )
        `)
        .eq('channel_id', channelId)
        .single();

      if (error) {
        DetailedLogger.error('EvolutionMessageService', `Erro ao buscar mapeamento da API para o canal ${channelId}: ${error.message}`);
        if (error.code === 'PGRST116') { // Not found
          DetailedLogger.warn('EvolutionMessageService', `Nenhum mapeamento de API encontrado para o canal ${channelId}. Tentando instância padrão.`);
          // Fallback to a default or general instance if logic allows
          // For now, return null to indicate specific channel config not found
          return null;
        }
        throw error;
      }

      if (data && data.api_instances) {
        const config = {
          apiKey: data.api_instances.api_key,
          baseUrl: data.api_instances.base_url,
          instanceName: data.api_instances.instance_name,
        };
        DetailedLogger.info('EvolutionMessageService', `Configuração da instância encontrada para o canal ${channelId}: ${config.instanceName}`);
        return config;
      }
      DetailedLogger.warn('EvolutionMessageService', `Nenhum dado de instância de API retornado para o canal ${channelId}`);
      return null;
    } catch (e) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao buscar configuração da instância para o canal ${channelId}`, e);
      return null;
    }
  }

  // Add the missing checkChannelConnectionStatus method
  public static async checkChannelConnectionStatus(channelId: string): Promise<ConnectionStatusResult> {
    DetailedLogger.info('EvolutionMessageService', `Verificando status de conexão para o canal: ${channelId}`);
    
    const instanceConfig = await this.getInstanceConfig(channelId);
    if (!instanceConfig) {
      DetailedLogger.error('EvolutionMessageService', `Configuração não encontrada para canal ${channelId}`);
      return { success: false, connected: false, error: 'Instance configuration not found' };
    }

    const { apiKey, baseUrl, instanceName } = instanceConfig;
    const endpoint = `${baseUrl}/instance/fetchInstances`;

    try {
      DetailedLogger.info('EvolutionMessageService', `Verificando conexão da instância ${instanceName}...`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });

      if (!response.ok) {
        const errorMsg = `Erro HTTP ${response.status}`;
        DetailedLogger.error('EvolutionMessageService', `Erro ao verificar status da instância: ${errorMsg}`);
        return { success: false, connected: false, error: errorMsg };
      }

      const instancesData = await response.json();
      DetailedLogger.info('EvolutionMessageService', `Dados das instâncias recebidos:`, instancesData);

      if (!Array.isArray(instancesData)) {
        DetailedLogger.error('EvolutionMessageService', 'Resposta inesperada da API - não é um array');
        return { success: false, connected: false, error: 'Invalid API response format' };
      }

      const targetInstance = instancesData.find(inst => inst.instance?.instanceName === instanceName);
      
      if (!targetInstance || !targetInstance.instance) {
        DetailedLogger.warn('EvolutionMessageService', `Instância '${instanceName}' não encontrada`);
        return { success: true, connected: false, instanceName, error: 'Instance not found' };
      }

      const isConnected = targetInstance.instance.status === 'open' || 
                         targetInstance.instance.status === 'connected' || 
                         targetInstance.instance.status === 'OPEN' || 
                         targetInstance.instance.status === 'CONNECTED';

      DetailedLogger.info('EvolutionMessageService', `Status da instância ${instanceName}: ${targetInstance.instance.status} (conectado: ${isConnected})`);
      
      return {
        success: true,
        connected: isConnected,
        instanceName,
      };

    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao verificar status da conexão:`, error);
      return { 
        success: false, 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Função para enviar mensagem de texto via N8N
  public static async sendTextMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { channelId, phoneNumber, message } = params;
    DetailedLogger.info('EvolutionMessageService', `Tentando enviar mensagem de texto via N8N para ${phoneNumber} no canal ${channelId}`);

    try {
      // Buscar mapping do canal para obter informações da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        DetailedLogger.error('EvolutionMessageService', `Mapping não encontrado para o canal ${channelId}`);
        return { success: false, error: 'Channel mapping not found' };
      }

      // Enviar via N8N
      const result = await N8nMessagingService.sendTextMessage(
        mapping.channel_name,
        mapping.instance_name,
        phoneNumber,
        message
      );

      if (result.success) {
        DetailedLogger.info('EvolutionMessageService', `Mensagem de texto enviada com sucesso via N8N para ${phoneNumber}`);
        
        // Armazenar mensagem enviada
        await this.createAndStoreMessage({
          channelId,
          sessionId: phoneNumber,
          messageContent: message,
          senderType: 'agent',
          messageType: 'text',
          contactName: 'Atendente',
        });
        
        return { success: true, messageId: Date.now().toString() };
      } else {
        DetailedLogger.error('EvolutionMessageService', `Erro ao enviar mensagem via N8N: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao enviar mensagem de texto via N8N:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public static async sendMediaMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { channelId, phoneNumber, message, mediaUrl, mediaType, caption } = params;
    DetailedLogger.info('EvolutionMessageService', `Tentando enviar mensagem de mídia (${mediaType}) via N8N para ${phoneNumber} no canal ${channelId}`);

    if (!mediaUrl || !mediaType) {
      DetailedLogger.error('EvolutionMessageService', 'URL da mídia ou tipo de mídia não fornecidos.');
      return { success: false, error: 'Media URL or type not provided' };
    }

    try {
      // Buscar mapping do canal para obter informações da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        DetailedLogger.error('EvolutionMessageService', `Mapping não encontrado para o canal ${channelId}`);
        return { success: false, error: 'Channel mapping not found' };
      }

      // Enviar via N8N
      const result = await N8nMessagingService.sendMediaMessage(
        mapping.channel_name,
        mapping.instance_name,
        phoneNumber,
        mediaUrl,
        caption || message,
        mediaType
      );

      if (result.success) {
        DetailedLogger.info('EvolutionMessageService', `Mensagem de mídia enviada com sucesso via N8N para ${phoneNumber}`);
        
        // Armazenar mensagem enviada
        await this.createAndStoreMessage({
          channelId,
          sessionId: phoneNumber,
          messageContent: caption || `[Mídia: ${mediaType}]`,
          senderType: 'agent',
          messageType: mediaType,
          contactName: 'Atendente',
          mediaBase64: mediaUrl.startsWith('data:') ? mediaUrl : undefined,
        });
        
        return { success: true, messageId: Date.now().toString() };
      } else {
        DetailedLogger.error('EvolutionMessageService', `Erro ao enviar mensagem de mídia via N8N: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao enviar mensagem de mídia via N8N:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private static async createAndStoreMessage(params: {
    channelId: string;
    sessionId: string;
    messageContent: string;
    senderType: 'customer' | 'agent' | 'USUARIO_INTERNO' | 'Yelena-ai' | 'CONTATO_EXTERNO'; // Ajustado para incluir todos os tipos
    messageType: MediaType | 'text';
    contactName?: string;
    mediaBase64?: string;
  }): Promise<void> {
    const {
      channelId,
      sessionId,
      messageContent,
      senderType,
      messageType,
      contactName,
      mediaBase64,
    } = params;

    const tableName = getTableNameForChannel(channelId); // Using imported util
    if (!tableName) {
      DetailedLogger.error('EvolutionMessageService', `Nome da tabela não encontrado para o channelId: ${channelId}`);
      return;
    }

    DetailedLogger.info('EvolutionMessageService', `Armazenando mensagem no Supabase, tabela: ${tableName}`);

    try {
      const { error } = await supabase.from(tableName as any).insert({ // Cast tableName to any
        session_id: sessionId,
        message: messageContent,
        tipo_remetente: senderType,
        mensagemtype: messageType,
        nome_do_contato: contactName || (senderType === 'agent' || senderType === 'USUARIO_INTERNO' || senderType === 'Yelena-ai' ? 'Atendente' : null),
        media_base64: mediaBase64,
        is_read: senderType !== 'CONTATO_EXTERNO', // Marcar como lida se não for do cliente
        read_at: senderType !== 'CONTATO_EXTERNO' ? new Date().toISOString() : null,
        // created_at e id são gerados automaticamente pelo Supabase
      });

      if (error) {
        DetailedLogger.error('EvolutionMessageService', `Erro ao armazenar mensagem no Supabase (tabela ${tableName}): ${error.message}`);
      } else {
        DetailedLogger.info('EvolutionMessageService', `Mensagem armazenada com sucesso no Supabase (tabela ${tableName})`);
      }
    } catch (e) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao armazenar mensagem no Supabase (tabela ${tableName})`, e);
    }
  }

  public static async syncChannelInstances(channelId: string): Promise<void> {
    DetailedLogger.info('EvolutionMessageService', `Sincronizando instâncias para o canal: ${channelId} (usando N8N)`);
    // Com N8N, a sincronização é simplificada pois o webhook é configurado automaticamente
    // Apenas validamos se o webhook N8N está funcionando
    try {
      const result = await N8nMessagingService.validateWebhook();
      if (result.success) {
        DetailedLogger.info('EvolutionMessageService', `Webhook N8N validado com sucesso para canal ${channelId}`);
      } else {
        DetailedLogger.warn('EvolutionMessageService', `Webhook N8N não está funcionando para canal ${channelId}: ${result.error}`);
      }
    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Erro ao validar webhook N8N para canal ${channelId}:`, error);
    }
  }
}

