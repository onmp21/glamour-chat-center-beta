import { supabase } from '../integrations/supabase/client';
import { ChannelApiMappingRepository } from '../repositories/ChannelApiMappingRepository';
import { ApiInstanceRepository } from '../repositories/ApiInstanceRepository';
import { EvolutionApiService } from './EvolutionApiService';

export type { ApiInstance } from '../types/domain/api/ApiInstance';

export class ChannelApiMappingService {
  private channelApiMappingRepository: ChannelApiMappingRepository;
  private apiInstanceRepository: ApiInstanceRepository;
  private connectionCache: Map<string, { timestamp: number, isConnected: boolean }> = new Map();
  private cacheTTL = 60000; // 1 minuto em milissegundos

  constructor() {
    this.channelApiMappingRepository = new ChannelApiMappingRepository();
    this.apiInstanceRepository = new ApiInstanceRepository();
  }

  // Mapear IDs de canal para nomes de tabelas de conversas
  private getChannelTableName(channelId: string): string {
    const channelTableMapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas',
      // Mapeamento por ID
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    };
    
    return channelTableMapping[channelId] || 'yelena_ai_conversas';
  }

  private channelNameToUuidMapping: Record<string, string> = {
    'chat': 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6',
    'canarana': '011b69ba-cf25-4f63-af2e-4ad0260d9516',
    'souto-soares': 'b7996f75-41a7-4725-8229-564f31868027',
    'joao-dourado': '621abb21-60b2-4ff2-a0a6-172a94b4b65c',
    'america-dourada': '64d8acad-c645-4544-a1e6-2f0825fae00b',
    'gerente-lojas': 'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce',
    'gerente-externo': 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7',
  };

  private getChannelUuid(channelIdOrName: string): string {
    // Check if it's already a UUID (simple check, not foolproof but sufficient for this context)
    if (channelIdOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return channelIdOrName;
    }
    // If it's a name, return the corresponding UUID
    return this.channelNameToUuidMapping[channelIdOrName] || channelIdOrName; // Fallback to original if not found
  }

  async getAllMappings() {
    return this.channelApiMappingRepository.getAll();
  }

  async getMappingByChannelId(channelId: string) {
    console.log(`🔍 [CHANNEL_API_MAPPING] Buscando mapeamento de API para canal ${channelId}`);
    const uuidChannelId = this.getChannelUuid(channelId); // Convert to UUID
    if (uuidChannelId !== channelId) {
      console.log(`🔄 [CHANNEL_API_MAPPING] Convertendo channelId '${channelId}' para UUID '${uuidChannelId}'`);
    }
    return this.channelApiMappingRepository.getByChannelId(uuidChannelId);
  }

  async getApiInstanceForChannel(channelId: string) {
    try {
      console.log(`🔍 [CHANNEL_API_MAPPING] Buscando instância da API para canal ${channelId}`);
      const mapping = await this.getMappingByChannelId(channelId);
      
      if (!mapping) {
        console.warn(`⚠️ [CHANNEL_API_MAPPING] Nenhum mapeamento encontrado para canal ${channelId}`);
        return null;
      }

      const apiInstance = await this.apiInstanceRepository.getById(mapping.api_instance_id);
      
      if (!apiInstance) {
        console.warn(`⚠️ [CHANNEL_API_MAPPING] Instância da API não encontrada para ID ${mapping.api_instance_id}`);
        return null;
      }
      
      console.log(`✅ [CHANNEL_API_MAPPING] Instância da API encontrada para canal ${channelId}: ${apiInstance.instance_name}`);
      return apiInstance;
    } catch (error) {
      console.error(`❌ [CHANNEL_API_MAPPING] Erro ao buscar instância da API para canal ${channelId}:`, error);
      return null;
    }
  }

  async upsertMapping(channelId: string, apiInstanceId: string) {
    console.log(`📝 [CHANNEL_API_MAPPING] Atualizando mapeamento para canal ${channelId} com instância ${apiInstanceId}`);
    const uuidChannelId = this.getChannelUuid(channelId); // Convert to UUID
    if (uuidChannelId !== channelId) {
      console.log(`🔄 [CHANNEL_API_MAPPING] Convertendo channelId '${channelId}' para UUID '${uuidChannelId}' para upsert`);
    }
    return this.channelApiMappingRepository.upsertByChannelId(uuidChannelId, apiInstanceId);
  }

  async deleteMappingByChannelId(channelId: string) {
    console.log(`🗑️ [CHANNEL_API_MAPPING] Removendo mapeamento para canal ${channelId}`);
    const uuidChannelId = this.getChannelUuid(channelId); // Convert to UUID
    if (uuidChannelId !== channelId) {
      console.log(`🔄 [CHANNEL_API_MAPPING] Convertendo channelId '${channelId}' para UUID '${uuidChannelId}' para exclusão`);
    }
    return this.channelApiMappingRepository.deleteByChannelId(uuidChannelId);
  }

  // Método para verificar conexão com cache
  async checkInstanceConnection(baseUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    const cacheKey = `${baseUrl}_${instanceName}`;
    const now = Date.now();
    const cachedResult = this.connectionCache.get(cacheKey);
    
    // Se tiver um resultado em cache válido, retornar
    if (cachedResult && (now - cachedResult.timestamp) < this.cacheTTL) {
      console.log(`🔍 [CHANNEL_API_MAPPING] Usando status de conexão em cache para ${instanceName}: ${cachedResult.isConnected ? 'conectado' : 'desconectado'}`);
      return cachedResult.isConnected;
    }
    
    try {
      console.log(`🔍 [CHANNEL_API_MAPPING] Verificando conexão da instância ${instanceName} em ${baseUrl}`);
      
      const evolutionService = new EvolutionApiService({
        baseUrl,
        apiKey,
        instanceName
      });
      
      const result = await evolutionService.getConnectionStatus();
      const isConnected = result.success && result.connected;
      
      console.log(`🔍 [CHANNEL_API_MAPPING] Status da instância ${instanceName}: ${result.state || 'unknown'} - Conectado: ${isConnected}`);
      
      // Atualizar cache com o resultado
      this.connectionCache.set(cacheKey, { timestamp: now, isConnected });
      return isConnected;
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao verificar conexão da instância:', error);
      
      // Atualizar cache com resultado negativo
      this.connectionCache.set(cacheKey, { timestamp: now, isConnected: false });
      return false;
    }
  }

  // Método para tentar reconectar a instância
  async reconnectInstance(baseUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    try {
      console.log(`🔄 [CHANNEL_API_MAPPING] Tentando reconectar instância ${instanceName}`);
      
      const response = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [CHANNEL_API_MAPPING] Erro ao reconectar instância: ${response.status} - ${errorText}`);
        return false;
      }

      // Aguardar um tempo para a instância reiniciar
      console.log(`⏳ [CHANNEL_API_MAPPING] Aguardando 5 segundos para a instância reiniciar...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Limpar o cache para esta instância
      const cacheKey = `${baseUrl}_${instanceName}`;
      this.connectionCache.delete(cacheKey);
      
      // Verificar se a reconexão foi bem-sucedida
      const isConnected = await this.checkInstanceConnection(baseUrl, apiKey, instanceName);
      console.log(`${isConnected ? '✅' : '❌'} [CHANNEL_API_MAPPING] Reconexão da instância ${instanceName}: ${isConnected ? 'sucesso' : 'falha'}`);
      return isConnected;
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao reconectar instância:', error);
      return false;
    }
  }

  // Método para enviar mensagem via API Evolution
  async sendMessageViaEvolution(channelId: string, phoneNumber: string, message: string, mediaBase64?: string, mediaType?: string): Promise<boolean> {
    try {
      console.log(`📤 [CHANNEL_API_MAPPING] Enviando mensagem para ${phoneNumber} via canal ${channelId}`);
      
      // Obter a instância da API para o canal
      const apiInstance = await this.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        console.error(`❌ [CHANNEL_API_MAPPING] Nenhuma instância da API configurada para o canal ${channelId}`);
        return false;
      }

      // Verificar se a instância está conectada
      const isConnected = await this.checkInstanceConnection(
        apiInstance.base_url, 
        apiInstance.api_key, 
        apiInstance.instance_name
      );
      
      if (!isConnected) {
        console.warn(`⚠️ [CHANNEL_API_MAPPING] Instância ${apiInstance.instance_name} não está conectada. Tentando reconectar...`);
        
        const reconnected = await this.reconnectInstance(
          apiInstance.base_url, 
          apiInstance.api_key, 
          apiInstance.instance_name
        );
        
        if (!reconnected) {
          console.error(`❌ [CHANNEL_API_MAPPING] Falha ao reconectar instância ${apiInstance.instance_name}`);
          return false;
        }
      }

      const evolutionService = new EvolutionApiService({
        baseUrl: apiInstance.base_url,
        apiKey: apiInstance.api_key,
        instanceName: apiInstance.instance_name
      });

      let result;
      
      if (mediaBase64 && mediaType) {
        // Enviar mensagem com mídia
        result = await evolutionService.sendMediaMessage(phoneNumber, mediaBase64, message);
      } else {
        // Enviar mensagem de texto
        result = await evolutionService.sendTextMessage(phoneNumber, message);
      }

      if (result.success) {
        console.log('✅ [CHANNEL_API_MAPPING] Mensagem enviada com sucesso via API Evolution');
        return true;
      } else {
        console.error(`❌ [CHANNEL_API_MAPPING] Erro ao enviar mensagem: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao enviar mensagem via API Evolution:', error);
      return false;
    }
  }

  // Método para obter foto de perfil de um contato
  async getContactProfilePicture(channelId: string, phoneNumber: string): Promise<string | null> {
    try {
      console.log(`🖼️ [CHANNEL_API_MAPPING] Obtendo foto de perfil para ${phoneNumber} via canal ${channelId}`);
      
      // Obter a instância da API para o canal
      const apiInstance = await this.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        console.error(`❌ [CHANNEL_API_MAPPING] Nenhuma instância da API configurada para o canal ${channelId}`);
        return null;
      }

      const evolutionService = new EvolutionApiService({
        baseUrl: apiInstance.base_url,
        apiKey: apiInstance.api_key,
        instanceName: apiInstance.instance_name
      });

      const result = await evolutionService.getProfilePicture(phoneNumber);
      
      if (result.success && result.data?.profilePictureUrl) {
        console.log(`✅ [CHANNEL_API_MAPPING] Foto de perfil obtida com sucesso para ${phoneNumber}`);
        return result.data.profilePictureUrl;
      } else {
        console.warn(`⚠️ [CHANNEL_API_MAPPING] Não foi possível obter foto de perfil para ${phoneNumber}: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao obter foto de perfil:', error);
      return null;
    }
  }

  // Método para salvar mensagem na tabela correta do canal
  async saveMessageToChannel(channelId: string, messageData: any): Promise<boolean> {
    try {
      const tableName = this.getChannelTableName(channelId);
      
      console.log(`💾 [CHANNEL_API_MAPPING] Salvando mensagem na tabela ${tableName}`);
      
      // Formatar dados da mensagem conforme especificação da tabela
      const formattedMessageData = {
        session_id: messageData.session_id, // numero do cliente
        message: messageData.message, // texto ou base64 da mensagem
        read_at: messageData.read_at, // hora que a mensagem foi enviada (horário de Brasília)
        Nome_do_contato: messageData.Nome_do_contato, // nome do cliente
        mensagemtype: messageData.mensagemtype, // audioMenssage, imageMenssage, videoMenssage, stickerMessage ou conversation
        tipo_remetente: messageData.tipo_remetente // quem enviou a mensagem "nome do cliente" ou "nome do canal"
      };
      
      const { error } = await supabase
        .from(tableName as any)
        .insert([formattedMessageData]);

      if (error) {
        console.error(`❌ [CHANNEL_API_MAPPING] Erro ao salvar mensagem na tabela ${tableName}:`, error);
        return false;
      }

      console.log(`✅ [CHANNEL_API_MAPPING] Mensagem salva com sucesso na tabela ${tableName}`);
      return true;
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao salvar mensagem no canal:', error);
      return false;
    }
  }

  // Método para buscar conversas do canal
  async getChannelConversations(channelId: string, limit: number = 50): Promise<any[]> {
    try {
      const tableName = this.getChannelTableName(channelId);
      
      console.log(`🔍 [CHANNEL_API_MAPPING] Buscando conversas da tabela ${tableName} (limite: ${limit})`);
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('id', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`❌ [CHANNEL_API_MAPPING] Erro ao buscar conversas da tabela ${tableName}:`, error);
        return [];
      }

      console.log(`✅ [CHANNEL_API_MAPPING] ${data?.length || 0} conversas encontradas na tabela ${tableName}`);
      return data || [];
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao buscar conversas do canal:', error);
      return [];
    }
  }
}

