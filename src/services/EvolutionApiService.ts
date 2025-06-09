
export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  instances?: InstanceInfo[];
  qrCode?: string;
}

export interface InstanceInfo {
  instanceName: string;
  status: string;
  profileName?: string;
  number?: string;
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

  async validateApi(): Promise<ApiResponse> {
    try {
      return this.makeRequest('/instance/fetchInstances', {
        method: 'GET'
      });
    } catch (error) {
      return {
        success: false,
        error: `Validation error: ${error}`
      };
    }
  }

  async listInstances(): Promise<ApiResponse> {
    try {
      const result = await this.makeRequest('/instance/fetchInstances', {
        method: 'GET'
      });

      if (result.success && result.data) {
        const instances: InstanceInfo[] = Array.isArray(result.data) 
          ? result.data.map((instance: any) => ({
              instanceName: instance.instance?.instanceName || instance.instanceName,
              status: instance.instance?.state || instance.state || 'unknown',
              profileName: instance.instance?.profileName || instance.profileName,
              number: instance.instance?.number || instance.number
            }))
          : [];

        return {
          success: true,
          instances
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Error listing instances: ${error}`
      };
    }
  }

  async createInstance(instanceName: string): Promise<ApiResponse> {
    return this.makeRequest('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });
  }

  async deleteInstance(instanceName: string): Promise<ApiResponse> {
    return this.makeRequest(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    });
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
    const result = await this.makeRequest(`/instance/connect/${instanceName}`, {
      method: 'GET'
    });

    if (result.success && result.data) {
      return {
        ...result,
        qrCode: result.data.code || result.data.qrCode || result.data.base64
      };
    }

    return result;
  }

  async getConnectionStatus(): Promise<ApiResponse> {
    return this.makeRequest(`/instance/connectionState/${this.config.instanceName}`, {
      method: 'GET'
    });
  }
}
