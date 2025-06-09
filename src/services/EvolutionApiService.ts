
import { supabase } from '../integrations/supabase/client';

export interface WebSocketConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  channelId?: string;
}

export interface WebSocketMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: any;
    messageTimestamp: number;
    pushName?: string;
  };
}

export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface InstanceInfo {
  instanceName: string;
  profileName?: string;
  number?: string;
  status: string;
  serverUrl?: string;
  apikey?: string;
  owner?: string;
  profilePictureUrl?: string;
  integration?: string;
}

export class EvolutionApiService {
  private config: EvolutionApiConfig;

  constructor(config: EvolutionApiConfig) {
    this.config = config;
  }

  private normalizeInstanceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  async validateApi(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔍 [EVOLUTION_API] Validando API em: ${this.config.baseUrl}`);

      const response = await fetch(`${this.config.baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API] API validada com sucesso!', data);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao validar API:', error);
      return { success: false, error: `${error}` };
    }
  }

  async listInstances(): Promise<{ success: boolean; instances?: InstanceInfo[]; error?: string }> {
    try {
      console.log(`📋 [EVOLUTION_API] Listando instâncias em: ${this.config.baseUrl}`);

      const response = await fetch(`${this.config.baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const instances: InstanceInfo[] = data.map((item: any) => ({
          instanceName: item.instance?.instanceName || item.instanceName,
          profileName: item.instance?.profileName,
          number: item.instance?.ownerJid?.replace('@s.whatsapp.net', ''),
          status: item.instance?.connectionStatus || item.connectionStatus || 'close',
          serverUrl: this.config.baseUrl,
          apikey: this.config.apiKey,
          owner: item.instance?.ownerJid || '',
          profilePictureUrl: item.instance?.profilePicUrl,
          integration: item.instance?.integration || 'WHATSAPP-BAILEYS'
        }));
        console.log(`✅ [EVOLUTION_API] Instâncias encontradas:`, instances);
        return { success: true, instances };
      } else {
        console.warn('⚠️ [EVOLUTION_API] Formato de resposta inesperado:', data);
        return { success: false, error: 'Formato de resposta inesperado' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return { success: false, error: `${error}` };
    }
  }

  async createInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`➕ [EVOLUTION_API] Criando instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({ 
          instanceName: normalizedName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [EVOLUTION_API] Instância criada com sucesso: ${normalizedName}`, data);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar instância:', error);
      return { success: false, error: `${error}` };
    }
  }

  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🗑️ [EVOLUTION_API] Excluindo instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/instance/delete/${normalizedName}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [EVOLUTION_API] Instância excluída com sucesso: ${normalizedName}`, data);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao excluir instância:', error);
      return { success: false, error: `${error}` };
    }
  }

  async configureWebSocket(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`⚙️ [EVOLUTION_API] Configurando WebSocket para instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/websocket/set/${normalizedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          enabled: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_SET',
            'CONNECTION_UPDATE',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE'
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [EVOLUTION_API] WebSocket configurado com sucesso para: ${normalizedName}`, data);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao configurar WebSocket:', error);
      return { success: false, error: `${error}` };
    }
  }

  async getQRCodeForInstance(instanceName: string): Promise<{ success: boolean; qrCode?: string; error?: string; connected?: boolean }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🔍 [EVOLUTION_API] Obtendo QR Code para instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/instance/connect/${normalizedName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [EVOLUTION_API] Resposta do QR Code:', data);
      
      // Verificar se já está conectado
      if (data.instance?.connectionStatus === 'open') {
        return { success: true, connected: true };
      }
      
      // Processar QR Code sem alterar o base64
      if (data.base64) {
        return { success: true, qrCode: data.base64 };
      } else if (data.code) {
        return { success: true, qrCode: data.code };
      } else {
        console.log('⚠️ [EVOLUTION_API] QR Code não disponível na resposta');
        return { success: false, error: 'QR Code não disponível' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error);
      return { success: false, error: `${error}` };
    }
  }

  async getQRCode(): Promise<{ success: boolean; qrCode?: string; error?: string; connected?: boolean }> {
    return this.getQRCodeForInstance(this.config.instanceName);
  }

  async getConnectionStatus(): Promise<{ state: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`🔍 [EVOLUTION_API] Verificando status de conexão para: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${normalizedName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        console.error(`❌ [EVOLUTION_API] Erro ao verificar status: ${response.status}`);
        return { state: 'close' };
      }

      const data = await response.json();
      console.log(`📡 [EVOLUTION_API] Status da conexão:`, data);
      
      return { state: data.instance?.state || data.state || 'close' };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao verificar status:', error);
      return { state: 'close' };
    }
  }

  async sendTextMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`📤 [EVOLUTION_API] Enviando texto para ${phoneNumber}`);

      const response = await fetch(`${this.config.baseUrl}/message/sendText/${normalizedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: message,
          delay: 1200
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.key) {
        console.log('✅ [EVOLUTION_API] Texto enviado com sucesso');
        return { success: true, messageId: data.key.id };
      } else {
        throw new Error(data.message || 'Falha ao enviar texto');
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar texto:', error);
      return { success: false, error: `${error}` };
    }
  }

  async sendMediaMessage(
    phoneNumber: string, 
    mediaBase64: string, 
    mediaType: 'image' | 'audio' | 'video' | 'document',
    caption?: string,
    fileName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`📤 [EVOLUTION_API] Enviando ${mediaType} para ${phoneNumber}`);

      let endpoint = '';
      let payload: any = {};

      if (mediaType === 'audio') {
        endpoint = `/message/sendWhatsAppAudio/${normalizedName}`;
        payload = {
          number: phoneNumber,
          audio: mediaBase64,
          delay: 1200
        };
      } else {
        endpoint = `/message/sendMedia/${normalizedName}`;
        payload = {
          number: phoneNumber,
          mediatype: mediaType,
          media: mediaBase64,
          caption: caption || '',
          fileName: fileName || `file.${mediaType}`,
          delay: 1200
        };
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.key) {
        console.log(`✅ [EVOLUTION_API] ${mediaType} enviado com sucesso`);
        return { success: true, messageId: data.key.id };
      } else {
        throw new Error(data.message || `Falha ao enviar ${mediaType}`);
      }
    } catch (error) {
      console.error(`❌ [EVOLUTION_API] Erro ao enviar ${mediaType}:`, error);
      return { success: false, error: `${error}` };
    }
  }

  async sendSticker(phoneNumber: string, stickerBase64: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`📤 [EVOLUTION_API] Enviando sticker para ${phoneNumber}`);

      const response = await fetch(`${this.config.baseUrl}/message/sendSticker/${normalizedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: phoneNumber,
          sticker: stickerBase64,
          delay: 1200
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.key) {
        console.log('✅ [EVOLUTION_API] Sticker enviado com sucesso');
        return { success: true, messageId: data.key.id };
      } else {
        throw new Error(data.message || 'Falha ao enviar sticker');
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar sticker:', error);
      return { success: false, error: `${error}` };
    }
  }
}

export const evolutionApiManager = {
  instances: new Map<string, EvolutionApiService>(),

  getInstanceByConfig(config: EvolutionApiConfig): EvolutionApiService | null {
    const key = `${config.baseUrl}-${config.instanceName}`;
    let instance = this.instances.get(key);
    
    if (!instance) {
      instance = new EvolutionApiService(config);
      this.instances.set(key, instance);
    }
    
    return instance;
  },

  async sendMessage(config: EvolutionApiConfig, chatId: string, message: string): Promise<boolean> {
    try {
      const normalizedName = config.instanceName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);

      const response = await fetch(`${config.baseUrl}/message/sendText/${normalizedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey
        },
        body: JSON.stringify({
          number: chatId,
          text: message,
          delay: 1200
        })
      });

      if (!response.ok) {
        console.error(`Erro ao enviar mensagem para ${chatId}: ${response.status} - ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      if (data.key) {
        console.log(`Mensagem enviada para ${chatId} com sucesso.`);
        return true;
      } else {
        console.error(`Falha ao enviar mensagem para ${chatId}:`, data);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${chatId}:`, error);
      return false;
    }
  }
};
