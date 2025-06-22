
interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  data?: any;
  instances?: any[];
  qrCode?: string;
  connected?: boolean;
  webhook?: any;
}

export interface InstanceInfo {
  instanceName: string;
  status?: string;
  profileName?: string;
  connectionStatus?: string;
  serverUrl?: string;
  integration?: string;
}

export class EvolutionApiService {
  private config: EvolutionApiConfig;

  constructor(config: EvolutionApiConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.config.apiKey,
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  private getBaseUrl() {
    return this.config.baseUrl.replace(/\/$/, '');
  }

  async validateConnection(): Promise<ApiResponse> {
    try {
      console.log('🔍 [EVOLUTION_API_SERVICE] Validating connection to:', this.getBaseUrl());
      
      const response = await fetch(`${this.getBaseUrl()}/instance/fetchInstances`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Connection validated successfully');
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Connection validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async listInstances(): Promise<ApiResponse> {
    try {
      console.log('📋 [EVOLUTION_API_SERVICE] Listing instances from:', this.getBaseUrl());
      
      const response = await fetch(`${this.getBaseUrl()}/instance/fetchInstances`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 [EVOLUTION_API_SERVICE] Raw response:', data);

      // Processar a resposta baseada na estrutura da API Evolution
      let instances: InstanceInfo[] = [];
      if (Array.isArray(data)) {
        instances = data.map(item => ({
          instanceName: item.instanceName || item.instance?.instanceName,
          status: item.status || item.instance?.state || 'close',
          profileName: item.profileName || item.instance?.profileName,
          connectionStatus: item.status || item.instance?.state || 'close',
          serverUrl: item.serverUrl || this.getBaseUrl(),
          integration: item.integration || 'WHATSAPP-BAILEYS'
        }));
      } else if (data && Array.isArray(data.instances)) {
        instances = data.instances.map(item => ({
          instanceName: item.instanceName || item.instance?.instanceName,
          status: item.status || item.instance?.state || 'close',
          profileName: item.profileName || item.instance?.profileName,
          connectionStatus: item.status || item.instance?.state || 'close',
          serverUrl: item.serverUrl || this.getBaseUrl(),
          integration: item.integration || 'WHATSAPP-BAILEYS'
        }));
      } else if (data && typeof data === 'object') {
        // Se a resposta é um objeto com instâncias como propriedades
        instances = Object.entries(data).map(([key, value]: [string, any]) => ({
          instanceName: key,
          status: value?.instance?.state || value?.state || 'close',
          profileName: value?.instance?.profileName || value?.profileName,
          connectionStatus: value?.instance?.state || value?.state || 'close',
          serverUrl: this.getBaseUrl(),
          integration: 'WHATSAPP-BAILEYS'
        }));
      }

      console.log('✅ [EVOLUTION_API_SERVICE] Processed instances:', instances);
      
      return {
        success: true,
        instances: instances
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to list instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar instâncias',
        instances: []
      };
    }
  }

  async createInstanceSimple(instanceName: string): Promise<ApiResponse> {
    try {
      console.log('🔨 [EVOLUTION_API_SERVICE] Creating instance:', instanceName);
      
      const response = await fetch(`${this.getBaseUrl()}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName: instanceName,
          token: this.config.apiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Instance created:', data);
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to create instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar instância'
      };
    }
  }

  async getQRCodeForInstance(instanceName: string): Promise<ApiResponse> {
    try {
      console.log('📱 [EVOLUTION_API_SERVICE] Getting QR Code for:', instanceName);
      
      // Usar endpoint correto para QR Code
      const qrResponse = await fetch(`${this.getBaseUrl()}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!qrResponse.ok) {
        throw new Error(`Erro ao obter QR Code: ${qrResponse.status}`);
      }

      const qrData = await qrResponse.json();
      
      let qrCode = null;
      if (qrData?.base64) {
        qrCode = qrData.base64;
      } else if (qrData?.qrcode?.base64) {
        qrCode = qrData.qrcode.base64;
      } else if (qrData?.qrCode) {
        qrCode = qrData.qrCode;
      }

      if (!qrCode) {
        throw new Error('QR Code não disponível na resposta da API');
      }

      console.log('✅ [EVOLUTION_API_SERVICE] QR Code obtained successfully');
      
      return {
        success: true,
        qrCode: qrCode
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to get QR Code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter QR Code'
      };
    }
  }

  async deleteInstance(instanceName: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ [EVOLUTION_API_SERVICE] Deleting instance:', instanceName);
      
      // Usar endpoint correto para deletar instância
      const response = await fetch(`${this.getBaseUrl()}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Algumas APIs retornam 204 No Content para delete bem-sucedido
      let data = {};
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch (e) {
          // Se não conseguir fazer parse do JSON, ainda considera sucesso
          data = { message: 'Instância removida com sucesso' };
        }
      }

      console.log('✅ [EVOLUTION_API_SERVICE] Instance deleted successfully');
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to delete instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover instância'
      };
    }
  }

  async disconnectInstance(instanceName: string): Promise<ApiResponse> {
    try {
      console.log('🔌 [EVOLUTION_API_SERVICE] Disconnecting instance:', instanceName);
      
      const response = await fetch(`${this.getBaseUrl()}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Instance disconnected successfully');
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to disconnect instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desconectar instância'
      };
    }
  }

  async getWebhook(): Promise<ApiResponse> {
    try {
      console.log('🔗 [EVOLUTION_API_SERVICE] Getting webhook for:', this.config.instanceName);
      
      const response = await fetch(`${this.getBaseUrl()}/webhook/find/${this.config.instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Webhook retrieved successfully');
      
      return {
        success: true,
        webhook: data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to get webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter webhook'
      };
    }
  }

  async setWebhook(webhookUrl?: string, events?: string[]): Promise<ApiResponse> {
    try {
      console.log('🔗 [EVOLUTION_API_SERVICE] Setting webhook for:', this.config.instanceName);
      
      const defaultWebhookUrl = webhookUrl || 'https://n8n.estudioonmp.com/webhook/3a0b2487-21d0-43c7-bc7f-07404879df5434232';
      const defaultEvents = events || [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        'CONTACTS_UPDATE',
        'CONTACTS_UPSERT',
        'PRESENCE_UPDATE',
        'CHATS_UPDATE',
        'CHATS_UPSERT',
        'CHATS_DELETE',
        'GROUPS_UPSERT',
        'GROUP_PARTICIPANTS_UPDATE',
        'CALL',
        'NEW_JWT_TOKEN'
      ];
      
      const response = await fetch(`${this.getBaseUrl()}/webhook/set/${this.config.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: defaultWebhookUrl,
          enabled: true,
          events: defaultEvents
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Webhook configured successfully');
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to configure webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao configurar webhook'
      };
    }
  }

  async getConnectionStatus(): Promise<ApiResponse> {
    try {
      console.log('🔍 [EVOLUTION_API_SERVICE] Getting connection status for:', this.config.instanceName);
      
      const response = await fetch(`${this.getBaseUrl()}/instance/connectionState/${this.config.instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Connection status retrieved:', data);
      
      return {
        success: true,
        connected: data?.instance?.state === 'open',
        data
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SERVICE] Failed to get connection status:', error);
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar status'
      };
    }
  }

  async setWebhookForChannel(channelName: string): Promise<ApiResponse> {
    return this.setWebhook();
  }
}
