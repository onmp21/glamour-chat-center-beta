
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
      let instances = [];
      if (Array.isArray(data)) {
        instances = data;
      } else if (data && Array.isArray(data.instances)) {
        instances = data.instances;
      } else if (data && typeof data === 'object') {
        // Se a resposta é um objeto com instâncias como propriedades
        instances = Object.entries(data).map(([key, value]: [string, any]) => ({
          instanceName: key,
          status: value?.instance?.state || value?.state || 'close',
          profileName: value?.instance?.profileName || value?.profileName
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
      
      // Primeiro, verificar se a instância existe e seu status
      const statusResponse = await fetch(`${this.getBaseUrl()}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!statusResponse.ok) {
        throw new Error(`Instância não encontrada ou não disponível: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      
      // Se já está conectada, retornar sucesso
      if (statusData?.instance?.state === 'open') {
        return {
          success: true,
          connected: true
        };
      }

      // Buscar QR Code
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

  async setWebhookForChannel(channelName: string): Promise<ApiResponse> {
    try {
      console.log('🔗 [EVOLUTION_API_SERVICE] Setting webhook for channel:', channelName);
      
      const webhookUrl = `${window.location.origin}/api/webhook/${this.config.instanceName}`;
      
      const response = await fetch(`${this.getBaseUrl()}/webhook/set/${this.config.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: webhookUrl,
          enabled: true,
          events: [
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
          ]
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
}
