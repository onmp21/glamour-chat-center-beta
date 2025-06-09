
export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class EvolutionApiService {
  private config: EvolutionApiConfig;

  constructor(config: EvolutionApiConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  async sendTextMessage(phoneNumber: string, message: string): Promise<ApiResponse> {
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    return this.makeRequest(`/message/sendText/${this.config.instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: `${cleanPhoneNumber}@s.whatsapp.net`,
        text: message
      })
    });
  }

  async sendMediaMessage(phoneNumber: string, mediaBase64: string, caption?: string, fileName?: string): Promise<ApiResponse> {
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    return this.makeRequest(`/message/sendMedia/${this.config.instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: `${cleanPhoneNumber}@s.whatsapp.net`,
        mediaBase64,
        caption: caption || '',
        fileName: fileName || 'file'
      })
    });
  }

  async getQRCodeForInstance(instanceName: string): Promise<ApiResponse> {
    return this.makeRequest(`/instance/connect/${instanceName}`, {
      method: 'GET'
    });
  }

  async getConnectionStatus(): Promise<ApiResponse> {
    return this.makeRequest(`/instance/connectionState/${this.config.instanceName}`, {
      method: 'GET'
    });
  }

  async configureWebSocket(instanceName: string): Promise<ApiResponse> {
    return this.makeRequest(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        url: `https://uxccfhptochnfomurulr.supabase.co/functions/v1/whatsapp-webhook-${instanceName.toLowerCase()}`,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'CONNECTION_UPDATE'
        ],
        webhook_by_events: false
      })
    });
  }
}
