import { supabase } from '../integrations/supabase/client';
import { ChannelApiMappingRepository } from '../repositories/ChannelApiMappingRepository';
import { ApiInstanceRepository } from '../repositories/ApiInstanceRepository';

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
    
    console.log(`🗂️ [CHANNEL_API_MAPPING] Mapeando canal ${channelId} para tabela ${channelTableMapping[channelId] || 'yelena_ai_conversas'}`);
    return channelTableMapping[channelId] || 'yelena_ai_conversas';
  }

  async getAllMappings() {
    console.log(`🔍 [CHANNEL_API_MAPPING] Buscando todos os mapeamentos de API`);
    return this.channelApiMappingRepository.getAll();
  }

  async getMappingByChannelId(channelId: string) {
    console.log(`🔍 [CHANNEL_API_MAPPING] Buscando mapeamento de API para canal ${channelId}`);
    return this.channelApiMappingRepository.getByChannelId(channelId);
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
    return this.channelApiMappingRepository.upsertByChannelId(channelId, apiInstanceId);
  }

  async deleteMappingByChannelId(channelId: string) {
    console.log(`🗑️ [CHANNEL_API_MAPPING] Removendo mapeamento para canal ${channelId}`);
    return this.channelApiMappingRepository.deleteByChannelId(channelId);
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
      
      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [CHANNEL_API_MAPPING] Erro ao verificar status da conexão: ${response.status} - ${errorText}`);
        
        // Atualizar cache com resultado negativo
        this.connectionCache.set(cacheKey, { timestamp: now, isConnected: false });
        return false;
      }

      const data = await response.json();
      const isConnected = data.instance?.state === 'open';
      
      console.log(`🔍 [CHANNEL_API_MAPPING] Status da instância ${instanceName}: ${data.instance?.state}`);
      
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
        method: 'POST',
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
  async sendMessageViaEvolution(channelId: string, phoneNumber: string, message: string, mediaUrl?: string): Promise<boolean> {
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

      // Preparar os dados da mensagem
      const messageData: any = {
        number: phoneNumber
      };

      // Verificar se é mensagem de texto ou mídia
      if (mediaUrl) {
        // Determinar o tipo de mídia com base na URL
        if (mediaUrl.startsWith('data:image')) {
          messageData.imageMessage = {
            image: mediaUrl.split(',')[1], // Remover o prefixo data:image/...;base64,
            caption: message || ''
          };
        } else if (mediaUrl.startsWith('data:audio')) {
          messageData.audioMessage = {
            audio: mediaUrl.split(',')[1]
          };
        } else if (mediaUrl.startsWith('data:video')) {
          messageData.videoMessage = {
            video: mediaUrl.split(',')[1],
            caption: message || ''
          };
        } else if (mediaUrl.startsWith('data:application')) {
          messageData.documentMessage = {
            document: mediaUrl.split(',')[1],
            fileName: 'document.pdf',
            caption: message || ''
          };
        } else {
          // Se não conseguir determinar o tipo, enviar como texto com link
          messageData.textMessage = {
            text: `${message || ''}\n${mediaUrl}`
          };
        }
      } else {
        // Mensagem de texto simples
        messageData.textMessage = {
          text: message
        };
      }

      // Enviar a mensagem para a API Evolution
      console.log(`🔄 [CHANNEL_API_MAPPING] Enviando mensagem para API Evolution: ${apiInstance.base_url}/message/sendMessage`);
      
      const response = await fetch(`${apiInstance.base_url}/message/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiInstance.api_key
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ [CHANNEL_API_MAPPING] Erro ao enviar mensagem via API Evolution: ${response.status} - ${errorData}`);
        return false;
      }

      const result = await response.json();
      console.log('✅ [CHANNEL_API_MAPPING] Mensagem enviada com sucesso via API Evolution:', result);
      return true;
    } catch (error) {
      console.error('❌ [CHANNEL_API_MAPPING] Erro ao enviar mensagem via API Evolution:', error);
      return false;
    }
  }

  // Método para salvar mensagem na tabela correta do canal
  async saveMessageToChannel(channelId: string, messageData: any): Promise<boolean> {
    try {
      const tableName = this.getChannelTableName(channelId);
      
      console.log(`💾 [CHANNEL_API_MAPPING] Salvando mensagem na tabela ${tableName}`);
      
      const { error } = await supabase
        .from(tableName as any)
        .insert([messageData]);

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

