// @ts-nocheck
// TODO: Postgrest Builder needs to be fixed, it's failing to build because of a type error where a PostgrestFilterBuilder is expected, but a PostgrestQueryBuilder is returned.
// TODO: All supabase.from calls need to be fixed to use the correct table names, not strings.
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
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

  // Função para enviar mensagem de texto
  public static async sendTextMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { channelId, phoneNumber, message } = params;
    DetailedLogger.info('EvolutionMessageService', `Tentando enviar mensagem de texto para ${phoneNumber} no canal ${channelId}`);

    const instanceConfig = await this.getInstanceConfig(channelId);
    if (!instanceConfig) {
      DetailedLogger.error('EvolutionMessageService', `Falha ao obter configuração da instância para o canal ${channelId}`);
      return { success: false, error: 'Instance configuration not found' };
    }

    const { apiKey, baseUrl, instanceName } = instanceConfig;
    const endpoint = `${baseUrl}/message/sendText/${instanceName}`;
    const payload = {
      number: phoneNumber,
      options: {
        delay: 1200,
        presence: 'composing',
        linkPreview: false,
      },
      textMessage: {
        text: message,
      },
    };

    try {
      DetailedLogger.info('EvolutionMessageService', `Enviando para ${endpoint} com payload:`, payload);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      DetailedLogger.info('EvolutionMessageService', `Resposta da API Evolution:`, responseData);

      if (response.ok && responseData?.key?.id) {
        DetailedLogger.info('EvolutionMessageService', `Mensagem de texto enviada com sucesso para ${phoneNumber}. ID: ${responseData.key.id}`);
        // Armazenar mensagem enviada
        await this.createAndStoreMessage({
          channelId,
          sessionId: phoneNumber,
          messageContent: message,
          senderType: 'agent', // Ou um tipo mais específico como 'USUARIO_INTERNO'
          messageType: 'text',
          contactName: 'Atendente', // Pode ser o nome do usuário logado
        });
        return { success: true, messageId: responseData.key.id };
      } else {
        const errorMsg = responseData?.message || responseData?.error?.message || `Falha ao enviar mensagem, status ${response.status}`;
        DetailedLogger.error('EvolutionMessageService', `Erro ao enviar mensagem de texto para ${phoneNumber}: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao enviar mensagem de texto para ${phoneNumber}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public static async sendMediaMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { channelId, phoneNumber, message, mediaUrl, mediaType, caption } = params;
    DetailedLogger.info('EvolutionMessageService', `Tentando enviar mensagem de mídia (${mediaType}) para ${phoneNumber} no canal ${channelId}`);

    const instanceConfig = await this.getInstanceConfig(channelId);
    if (!instanceConfig) {
      DetailedLogger.error('EvolutionMessageService', `Falha ao obter configuração da instância para o canal ${channelId}`);
      return { success: false, error: 'Instance configuration not found' };
    }

    if (!mediaUrl || !mediaType) {
      DetailedLogger.error('EvolutionMessageService', 'URL da mídia ou tipo de mídia não fornecidos.');
      return { success: false, error: 'Media URL or type not provided' };
    }

    const { apiKey, baseUrl, instanceName } = instanceConfig;
    const endpoint = `${baseUrl}/message/sendMedia/${instanceName}`;

    // Determinar o tipo de mensagem com base no mediaType
    let messagePayloadKey: string;
    switch (mediaType) {
      case 'image':
        messagePayloadKey = 'imageMessage';
        break;
      case 'audio':
        messagePayloadKey = 'audioMessage';
        break;
      case 'video':
        messagePayloadKey = 'videoMessage';
        break;
      case 'document':
        messagePayloadKey = 'documentMessage';
        break;
      default:
        DetailedLogger.error('EvolutionMessageService', `Tipo de mídia inválido: ${mediaType}`);
        return { success: false, error: 'Invalid media type' };
    }

    const payload = {
      number: phoneNumber,
      options: {
        delay: 1200,
        presence: 'composing',
      },
      mediaMessage: {
        media: mediaUrl, // Pode ser URL ou Base64
        caption: caption || message, // Legenda
        // Adicionar outros campos específicos do tipo de mídia, se necessário
        // Ex: para áudio: ptt: true (se for áudio gravado)
        // Ex: para documento: fileName: "documento.pdf"
        ...(mediaType === 'audio' && { ptt: true }), // Exemplo para áudio PTT
        ...(mediaType === 'document' && { fileName: caption || 'document' }), // Exemplo para documento
      },
    };
    
    // Renomear a chave 'mediaMessage' para a chave específica do tipo de mídia
    // @ts-ignore
    payload[messagePayloadKey] = payload.mediaMessage;
    // @ts-ignore
    delete payload.mediaMessage;


    try {
      DetailedLogger.info('EvolutionMessageService', `Enviando para ${endpoint} com payload:`, payload);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      DetailedLogger.info('EvolutionMessageService', `Resposta da API Evolution (mídia):`, responseData);

      if (response.ok && responseData?.key?.id) {
        DetailedLogger.info('EvolutionMessageService', `Mensagem de mídia enviada com sucesso para ${phoneNumber}. ID: ${responseData.key.id}`);
        // Armazenar mensagem enviada
        await this.createAndStoreMessage({
          channelId,
          sessionId: phoneNumber,
          messageContent: caption || `[Mídia: ${mediaType}]`,
          senderType: 'agent',
          messageType: mediaType,
          contactName: 'Atendente',
          mediaBase64: mediaUrl.startsWith('data:') ? mediaUrl : undefined, // Armazenar se for base64
        });
        return { success: true, messageId: responseData.key.id };
      } else {
        const errorMsg = responseData?.message || responseData?.error?.message || `Falha ao enviar mídia, status ${response.status}`;
        DetailedLogger.error('EvolutionMessageService', `Erro ao enviar mensagem de mídia para ${phoneNumber}: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Exceção ao enviar mensagem de mídia para ${phoneNumber}:`, error);
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
    DetailedLogger.info('EvolutionMessageService', `Sincronizando instâncias para o canal: ${channelId}`);
    const instanceConfig = await this.getInstanceConfig(channelId);

    if (!instanceConfig) {
      DetailedLogger.warn('EvolutionMessageService', `Nenhuma configuração de instância encontrada para o canal ${channelId}. Impossível sincronizar.`);
      return;
    }

    const { apiKey, baseUrl, instanceName } = instanceConfig;

    const fetchInstancesEndpoint = `${baseUrl}/instance/fetchInstances`;
    const connectInstanceEndpoint = (instanceNameToConnect: string) => `${baseUrl}/instance/connect/${instanceNameToConnect}`;

    try {
      // 1. Buscar todas as instâncias ativas na API Evolution
      DetailedLogger.info('EvolutionMessageService', `Buscando instâncias da API Evolution: ${fetchInstancesEndpoint}`);
      const fetchResponse = await fetch(fetchInstancesEndpoint, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.text();
        DetailedLogger.error('EvolutionMessageService', `Erro ao buscar instâncias da API Evolution (${fetchResponse.status}): ${errorData}`);
        return;
      }

      const instancesData = await fetchResponse.json();
      DetailedLogger.info('EvolutionMessageService', `Instâncias recebidas da API:`, instancesData);

      if (!Array.isArray(instancesData)) {
        DetailedLogger.error('EvolutionMessageService', 'Resposta inesperada ao buscar instâncias. Não é um array.');
        return;
      }
      
      // Filtrar apenas a instância correspondente ao instanceName configurado
      const targetInstance = instancesData.find(inst => inst.instance?.instanceName === instanceName);

      if (!targetInstance || !targetInstance.instance) {
        DetailedLogger.warn('EvolutionMessageService', `Instância '${instanceName}' não encontrada na API Evolution ou dados da instância ausentes.`);
        // Marcar como inativa no Supabase se existir
        await this.updateChannelInstanceMapping(channelId, instanceName, { is_active: false });
        return;
      }

      const instanceDetail = targetInstance.instance;
      DetailedLogger.info('EvolutionMessageService', `Detalhes da instância '${instanceName}':`, instanceDetail);

      // 2. Conectar a instância se estiver desconectada
      if (instanceDetail.status === 'close' || instanceDetail.status === 'CLOSED') {
        DetailedLogger.info('EvolutionMessageService', `Instância '${instanceName}' está fechada. Tentando conectar...`);
        const connectResponse = await fetch(connectInstanceEndpoint(instanceName), {
          method: 'GET', // Ou POST, dependendo da API
          headers: { 'apikey': apiKey },
        });
        const connectData = await connectResponse.json();
        DetailedLogger.info('EvolutionMessageService', `Resposta da conexão da instância '${instanceName}':`, connectData);
        if (!connectResponse.ok || connectData.status !== 'success') { // Ajustar condição de sucesso conforme a API
            DetailedLogger.error('EvolutionMessageService', `Falha ao conectar instância '${instanceName}': ${connectData.message || 'Erro desconhecido'}`);
            // Atualizar status no Supabase como inativo devido à falha na conexão
            await this.updateChannelInstanceMapping(channelId, instanceName, { is_active: false });
            return; // Interrompe se não conseguir conectar
        }
        DetailedLogger.info('EvolutionMessageService', `Instância '${instanceName}' conectada com sucesso.`);
        // Atualizar o status da instância localmente para refletir a conexão bem-sucedida
        instanceDetail.status = 'open'; // Ou o status que a API retorna para conectado
      }
      
      // 3. Atualizar ou inserir o mapeamento da instância no Supabase
      // Ensure channel_name is included as it's required by the table
      const channelInfo = await ChannelService.getChannelById(channelId);
      const channelName = channelInfo?.name || instanceName; // Fallback for channelName

      await this.updateChannelInstanceMapping(channelId, instanceName, {
        base_url: baseUrl, // O baseUrl da configuração do canal
        api_key: apiKey,   // O apiKey da configuração do canal
        is_active: instanceDetail.status === 'open' || instanceDetail.status === 'connected' || instanceDetail.status === 'OPEN' || instanceDetail.status === 'CONNECTED',
        channel_name: channelName, // Added required channel_name
        // Outros campos como owner, profileName, etc., podem ser atualizados se necessário e disponíveis
      });

      DetailedLogger.info('EvolutionMessageService', `Sincronização da instância '${instanceName}' para o canal ${channelId} concluída.`);

    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Erro durante a sincronização de instâncias para o canal ${channelId}:`, error);
    }
  }

  private static async updateChannelInstanceMapping(
    channelId: string,
    instanceName: string,
    updateData: Partial<Database['public']['Tables']['channel_instance_mappings']['Update']> & { channel_name?: string } // Ensure channel_name can be passed
  ): Promise<void> {
    DetailedLogger.info('EvolutionMessageService', `Atualizando mapeamento para canal ${channelId}, instância ${instanceName}`, updateData);
    
    // Obter o nome do canal se não for fornecido diretamente
    let channelName = updateData.channel_name;
    if (!channelName) {
        const channelInfo = await ChannelService.getChannelById(channelId);
        channelName = channelInfo?.name || instanceName; // Use instanceName as fallback
    }


    const { data: existing, error: selectError } = await supabase
      .from('channel_instance_mappings')
      .select('id')
      .eq('channel_id', channelId)
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (selectError) {
      DetailedLogger.error('EvolutionMessageService', `Erro ao verificar mapeamento existente: ${selectError.message}`);
      return;
    }
    
    const dataToUpsert = {
        ...updateData,
        channel_name: channelName, // Ensure channel_name is set
        updated_at: new Date().toISOString(),
    };
    // Remove channel_name from updateData if it was added temporarily for type checking
    // delete dataToUpsert.channel_name; 


    if (existing) {
      // Atualizar
      const { error: updateError } = await supabase
        .from('channel_instance_mappings')
        .update(dataToUpsert)
        .eq('id', existing.id);
      if (updateError) {
        DetailedLogger.error('EvolutionMessageService', `Erro ao atualizar mapeamento: ${updateError.message}`);
      } else {
        DetailedLogger.info('EvolutionMessageService', 'Mapeamento atualizado com sucesso.');
      }
    } else {
      // Inserir
      const { error: insertError } = await supabase
        .from('channel_instance_mappings')
        .insert({
          channel_id: channelId,
          instance_name: instanceName,
          api_key: updateData.api_key || '', 
          base_url: updateData.base_url || '',
          is_active: updateData.is_active === undefined ? true : updateData.is_active,
          instance_id: updateData.instance_id || instanceName, 
          channel_name: channelName, // Ensure channel_name is part of the insert
          // created_at e updated_at têm default
          ...updateData // Spread remaining valid properties
        });
      if (insertError) {
        DetailedLogger.error('EvolutionMessageService', `Erro ao inserir novo mapeamento: ${insertError.message}`);
      } else {
        DetailedLogger.info('EvolutionMessageService', 'Novo mapeamento inserido com sucesso.');
      }
    }
  }

  public static async syncChannelInstance(
    channelId: string,
    instanceId: string, // Este é o 'instance_name' da API Evolution
    apiKey: string,
    baseUrl: string
  ): Promise<void> {
    DetailedLogger.info('EvolutionMessageService', `Sincronizando instância específica: canal ${channelId}, instância ${instanceId}`);
    
    const connectInstanceEndpoint = `${baseUrl}/instance/connect/${instanceId}`;
    const instanceStatusEndpoint = `${baseUrl}/instance/fetchInstances`; // Para obter o status atualizado

    try {
      // 1. Tentar conectar a instância
      DetailedLogger.info('EvolutionMessageService', `Tentando conectar instância '${instanceId}'...`);
      const connectResponse = await fetch(connectInstanceEndpoint, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      const connectData = await connectResponse.json();
      DetailedLogger.info('EvolutionMessageService', `Resposta da conexão da instância '${instanceId}':`, connectData);

      let isActive = false;
      if (connectResponse.ok && (connectData.status === 'success' || connectData.instance?.status === 'open' || connectData.instance?.status === 'connected')) {
        DetailedLogger.info('EvolutionMessageService', `Instância '${instanceId}' conectada/já estava conectada.`);
        isActive = true;
      } else {
         // Se a conexão inicial falhar, verificar o status para ver se já está conectada
        const statusResponse = await fetch(instanceStatusEndpoint, {
            method: 'GET',
            headers: { 'apikey': apiKey }
        });
        const statusData = await statusResponse.json();
        const currentInstance = Array.isArray(statusData) ? statusData.find(inst => inst.instance?.instanceName === instanceId) : null;

        if (currentInstance && (currentInstance.instance.status === 'open' || currentInstance.instance.status === 'connected')) {
            DetailedLogger.info('EvolutionMessageService', `Instância '${instanceId}' já estava conectada (verificado via fetchInstances).`);
            isActive = true;
        } else {
            DetailedLogger.error('EvolutionMessageService', `Falha ao conectar instância '${instanceId}': ${connectData.message || 'Status desconhecido após falha na conexão.'}`);
        }
      }
      
      // Obter o nome do canal
      const channelInfo = await ChannelService.getChannelById(channelId);
      const channelName = channelInfo?.name || instanceId; // Usa instanceId como fallback se o nome do canal não for encontrado

      // 2. Atualizar ou inserir o mapeamento da instância no Supabase
      const updatePayload: Database['public']['Tables']['channel_instance_mappings']['Insert'] = {
        // id is auto-generated for insert, don't include for update where it's used in .eq()
        // created_at is auto-generated for insert
        updated_at: new Date().toISOString(),
        channel_id: channelId,
        api_key: apiKey,
        base_url: baseUrl,
        is_active: isActive,
        instance_name: instanceId,
        instance_id: instanceId, // Assumindo que instance_id é o mesmo que instance_name para este contexto
        channel_name: channelName, // Adicionado channel_name
      };
      
      const { data: existing, error: selectError } = await supabase
        .from('channel_instance_mappings')
        .select('id')
        .eq('channel_id', channelId)
        .eq('instance_name', instanceId)
        .maybeSingle();

      if (selectError) {
        DetailedLogger.error('EvolutionMessageService', `Erro ao verificar mapeamento para ${instanceId}: ${selectError.message}`);
        return;
      }
      
      // Remove id and created_at from payload if it's an update, as they shouldn't be updated directly or are set by DB.
      // For insert, Supabase handles id and created_at if they have defaults.
      const { id: _id, created_at: _createdAt, ...payloadForUpsert } = updatePayload;


      if (existing) {
        const { error: updateError } = await supabase
          .from('channel_instance_mappings')
          .update(payloadForUpsert) // Use payloadForUpsert for update
          .eq('id', existing.id);
        if (updateError) throw updateError;
        DetailedLogger.info('EvolutionMessageService', `Mapeamento da instância ${instanceId} atualizado.`);
      } else {
        const { error: insertError } = await supabase
          .from('channel_instance_mappings')
          .insert(updatePayload); // Use full updatePayload for insert, Supabase handles defaults for id/created_at
        if (insertError) throw insertError;
        DetailedLogger.info('EvolutionMessageService', `Novo mapeamento para instância ${instanceId} inserido.`);
      }

    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Erro durante a sincronização da instância ${instanceId} para o canal ${channelId}:`, error);
       // Tentar atualizar como inativo em caso de erro grave
        try {
            const channelInfo = await ChannelService.getChannelById(channelId);
            const channelName = channelInfo?.name || instanceId;
            await this.updateChannelInstanceMapping(channelId, instanceId, { is_active: false, api_key: apiKey, base_url: baseUrl, channel_name: channelName, instance_id: instanceId });
        } catch (finalError) {
            DetailedLogger.error('EvolutionMessageService', `Erro ao tentar marcar instância ${instanceId} como inativa após falha:`, finalError);
        }
    }
  }
  
  public static async deleteChannelInstance(channelId: string, instanceName: string): Promise<void> {
    DetailedLogger.info('EvolutionMessageService', `Excluindo instância ${instanceName} do canal ${channelId}`);
    
    const instanceConfig = await this.getInstanceConfig(channelId);
    if (!instanceConfig) {
      DetailedLogger.error('EvolutionMessageService', `Configuração não encontrada para canal ${channelId}, não é possível excluir instância.`);
      return;
    }

    const { apiKey, baseUrl } = instanceConfig;
    // A exclusão da instância na API Evolution pode variar (logout, delete, etc.)
    // Exemplo: endpoint de logout
    const logoutEndpoint = `${baseUrl}/instance/logout/${instanceName}`;
    // Exemplo: endpoint de exclusão (se existir e for seguro usar)
    // const deleteEndpoint = `${baseUrl}/instance/delete/${instanceName}`;

    try {
      // 1. Tentar deslogar/excluir da API Evolution
      DetailedLogger.info('EvolutionMessageService', `Tentando deslogar instância ${instanceName} da API Evolution...`);
      const apiResponse = await fetch(logoutEndpoint, { // Ou deleteEndpoint
        method: 'DELETE', // Ou o método apropriado
        headers: { 'apikey': apiKey },
      });

      const responseData = await apiResponse.json();
      if (apiResponse.ok && responseData.status === "success") { // Ajustar condição de sucesso
        DetailedLogger.info('EvolutionMessageService', `Instância ${instanceName} deslogada/excluída da API Evolution.`);
      } else {
        DetailedLogger.warn('EvolutionMessageService', `Falha ou resposta inesperada ao deslogar/excluir ${instanceName} da API: ${responseData.message || 'Status: ' + apiResponse.status}`);
        // Continuar mesmo se falhar na API, para remover do Supabase
      }

      // 2. Remover o mapeamento do Supabase
      const { error: dbError } = await supabase
        .from('channel_instance_mappings')
        .delete()
        .eq('channel_id', channelId)
        .eq('instance_name', instanceName);

      if (dbError) {
        DetailedLogger.error('EvolutionMessageService', `Erro ao excluir mapeamento da instância ${instanceName} do Supabase: ${dbError.message}`);
      } else {
        DetailedLogger.info('EvolutionMessageService', `Mapeamento da instância ${instanceName} excluído do Supabase.`);
      }

    } catch (error) {
      DetailedLogger.error('EvolutionMessageService', `Erro ao excluir instância ${instanceName}:`, error);
    }
  }
}

// Export an instance of the service
export const evolutionMessageService = EvolutionMessageService;
