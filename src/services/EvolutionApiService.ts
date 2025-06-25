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
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'unknown';
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
      'apikey': this.config.apiKey
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

      let instances: InstanceInfo[] = [];
      
      if (Array.isArray(data)) {
        instances = data.map(item => ({
          instanceName: item.instance?.instanceName || item.instanceName,
          status: item.instance?.state || item.state || 'close',
          profileName: item.instance?.profileName || item.profileName,
          connectionStatus: this.mapConnectionStatus(item.instance?.state || item.state || 'close'),
          serverUrl: item.serverUrl || this.getBaseUrl(),
          integration: item.integration || 'WHATSAPP-BAILEYS'
        }));
      } else if (data && typeof data === 'object') {
        instances = Object.entries(data).map(([key, value]: [string, any]) => ({
          instanceName: value?.instance?.instanceName || value?.instanceName || key,
          status: value?.instance?.state || value?.state || 'close',
          profileName: value?.instance?.profileName || value?.profileName,
          connectionStatus: this.mapConnectionStatus(value?.instance?.state || value?.state || 'close'),
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

  private mapConnectionStatus(state: string): 'connected' | 'disconnected' | 'connecting' | 'unknown' {
    switch (state?.toLowerCase()) {
      case 'open':
        return 'connected';
      case 'close':
      case 'closed':
        return 'disconnected';
      case 'connecting':
        return 'connecting';
      default:
        return 'unknown';
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
      
      // Primeiro, verificar se a instância existe
      const listResponse = await this.listInstances();
      if (!listResponse.success || !listResponse.instances) {
        throw new Error('Erro ao verificar instâncias existentes');
      }

      const instanceExists = listResponse.instances.some(inst => inst.instanceName === instanceName);
      if (!instanceExists) {
        console.log('⚠️ [EVOLUTION_API_SERVICE] Instance does not exist, creating it first...');
        const createResult = await this.createInstanceSimple(instanceName);
        if (!createResult.success) {
          throw new Error(`Erro ao criar instância: ${createResult.error}`);
        }
        // Aguardar um pouco para a instância ser criada
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const qrResponse = await fetch(`${this.getBaseUrl()}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!qrResponse.ok) {
        const errorText = await qrResponse.text();
        console.error('❌ [EVOLUTION_API_SERVICE] QR Error response:', errorText);
        throw new Error(`Erro ao obter QR Code: ${qrResponse.status} - ${errorText}`);
      }

      const qrData = await qrResponse.json();
      console.log('📱 [EVOLUTION_API_SERVICE] QR Response data:', qrData);
      
      // Processar base64 do QR code conforme documentação da API Evolution
      let qrCode = null;
      if (qrData?.code) {
        // O campo 'code' contém o QR Code em base64 conforme a documentação
        qrCode = qrData.code.startsWith("data:") ? qrData.code : `data:image/png;base64,${qrData.code}`;
      } else if (qrData?.base64) {
        qrCode = qrData.base64.startsWith("data:") ? qrData.base64 : `data:image/png;base64,${qrData.base64}`;
      } else if (qrData?.qrcode?.base64) {
        qrCode = qrData.qrcode.base64.startsWith("data:") ? qrData.qrcode.base64 : `data:image/png;base64,${qrData.qrcode.base64}`;
      } else if (qrData?.qrCode) {
        qrCode = qrData.qrCode.startsWith("data:") ? qrData.qrCode : `data:image/png;base64,${qrData.qrCode}`;
      }

      if (!qrCode) {
        console.error('❌ [EVOLUTION_API_SERVICE] No QR code found in response:', qrData);
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

      console.log('🗑️ [EVOLUTION_API_SERVICE] Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API_SERVICE] Delete error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      let data = {};
      const contentType = response.headers.get('content-type');
      
      if (response.status !== 204 && contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          console.log('No JSON response, assuming success');
          data = { message: 'Instância removida com sucesso' };
        }
      } else {
        data = { message: 'Instância removida com sucesso' };
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

  async getConnectionStatus(instanceName: string): Promise<ApiResponse> {
    try {
      console.log("🔍 [EVOLUTION_API_SERVICE] Getting connection status for:", instanceName);
      
      const response = await fetch(`${this.getBaseUrl()}/instance/connectionState/${instanceName}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Connection status retrieved:', data);
      
      const isConnected = data?.instance?.state === 'open';
      
      return {
        success: true,
        connected: isConnected,
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

  async getWebhook(): Promise<ApiResponse> {
    try {
      console.log('🔍 [EVOLUTION_API_SERVICE] Getting webhook for:', this.config.instanceName);
      
      const response = await fetch(`${this.getBaseUrl()}/webhook/find/${this.config.instanceName}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API_SERVICE] Webhook retrieved:', data);
      
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
        'GROUPS_UPSERT'
      ];
      
      const response = await fetch(`${this.getBaseUrl()}/webhook/set/${this.config.instanceName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          enabled: true,
          url: defaultWebhookUrl,
          webhookByEvents: false,
          webhookBase64: true,
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

  async setWebhookForChannel(channelName: string): Promise<ApiResponse> {
    return this.setWebhook();
  }
}
