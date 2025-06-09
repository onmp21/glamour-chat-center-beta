
import { supabase } from '../integrations/supabase/client';

export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  pairingCode?: string;
  error?: string;
  connected?: boolean;
  message?: string;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface InstanceStatus {
  state: 'open' | 'close' | 'connecting' | 'qr';
  qrCode?: string;
}

export interface InstanceInfo {
  instanceName: string;
  status: string;
  serverUrl: string;
  apikey: string;
  owner: string;
  profileName?: string;
  profilePictureUrl?: string;
  integration?: string;
  number?: string;
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

  // Validar conexão com a API Evolution
  async validateApi(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔍 [EVOLUTION_API] Validando API: ${this.config.baseUrl}`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro na validação: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const instances = await response.json();
      console.log(`✅ [EVOLUTION_API] API validada com sucesso. Instâncias encontradas: ${instances.length}`);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao validar API:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  // Listar todas as instâncias disponíveis
  async listInstances(): Promise<{ success: boolean; instances?: InstanceInfo[]; error?: string }> {
    try {
      console.log(`📋 [EVOLUTION_API] Listando instâncias disponíveis`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao listar instâncias: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const rawInstances = await response.json();
      console.log(`✅ [EVOLUTION_API] Instâncias encontradas (raw):`, rawInstances);
      
      // Mapear para formato padronizado
      const instances: InstanceInfo[] = rawInstances.map((item: any) => ({
        instanceName: item.name || item.instanceName,
        status: item.connectionStatus || item.status || 'unknown',
        serverUrl: this.config.baseUrl,
        apikey: this.config.apiKey,
        owner: item.ownerJid || 'unknown',
        profileName: item.profileName,
        profilePictureUrl: item.profilePicUrl,
        integration: item.integration || 'WHATSAPP-BAILEYS',
        number: item.ownerJid ? item.ownerJid.replace('@s.whatsapp.net', '') : null
      }));
      
      console.log(`✅ [EVOLUTION_API] Instâncias mapeadas:`, instances);

      return {
        success: true,
        instances
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  // Criar nova instância
  async createInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🚀 [EVOLUTION_API] Criando instância: ${normalizedName} (original: ${instanceName})`);
      
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
        console.error(`❌ [EVOLUTION_API] Erro ao criar instância: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Instância criada com sucesso:`, result);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar instância:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  // Excluir instância
  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🗑️ [EVOLUTION_API] Deletando instância: ${normalizedName}`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/delete/${normalizedName}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao deletar instância: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Instância deletada:`, result);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao deletar instância:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  // Configurar WebSocket para instância
  async configureWebSocket(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🔌 [EVOLUTION_API] Configurando WebSocket para: ${normalizedName}`);
      
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
        console.error(`❌ [EVOLUTION_API] Erro ao configurar WebSocket: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] WebSocket configurado:`, result);
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao configurar WebSocket:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  async instanceExists(): Promise<boolean> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`🔍 [EVOLUTION_API] Verificando se instância existe: ${normalizedName}`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        console.error(`❌ [EVOLUTION_API] Erro ao verificar instâncias: ${response.status}`);
        return false;
      }

      const instances = await response.json();
      const exists = instances.some((instance: any) => 
        instance.instance?.instanceName === normalizedName || 
        instance.name === normalizedName
      );
      
      console.log(`📋 [EVOLUTION_API] Instância ${normalizedName} ${exists ? 'existe' : 'não existe'}`);
      return exists;
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao verificar instância:', error);
      return false;
    }
  }

  async getQRCode(): Promise<QRCodeResponse> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`🔍 [EVOLUTION_API] Obtendo QR Code para instância: ${normalizedName}`);
      
      // Primeiro verificar o status atual
      const currentStatus = await this.getConnectionStatus();
      if (currentStatus?.state === 'open') {
        console.log(`✅ [EVOLUTION_API] Instância ${normalizedName} já conectada`);
        return {
          success: true,
          connected: true,
          message: 'Instância já conectada'
        };
      }
      
      // Verificar se a instância existe
      const exists = await this.instanceExists();
      if (!exists) {
        console.log(`🚀 [EVOLUTION_API] Instância não existe, criando: ${normalizedName}`);
        const createResult = await this.createInstance(normalizedName);
        if (!createResult.success) {
          return { success: false, error: createResult.error };
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Tentar conectar e obter QR code
      const response = await fetch(`${this.config.baseUrl}/instance/connect/${normalizedName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao obter QR Code: ${response.status} - ${errorText}`);
        
        // Se erro 404, tentar criar instância novamente
        if (response.status === 404) {
          console.log(`🔄 [EVOLUTION_API] Tentando criar instância novamente: ${normalizedName}`);
          const createResult = await this.createInstance(normalizedName);
          if (createResult.success) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            return this.getQRCode(); // Tentar novamente
          }
        }
        
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Resposta do QR Code:`, result);
      
      // Processar QR Code com base64Utils
      let qrCodeData = null;
      const qrFields = ['base64', 'code', 'qrcode', 'qr', 'qrCode'];
      
      for (const field of qrFields) {
        if (result[field]) {
          const rawQrData = result[field];
          
          // Verificar se já é uma data URL válida
          if (rawQrData.startsWith('data:image/')) {
            qrCodeData = rawQrData;
          } else if (rawQrData.startsWith('data:')) {
            qrCodeData = rawQrData.replace('data:', 'data:image/png;base64,');
          } else {
            // Limpar e validar base64
            const cleanBase64 = rawQrData.replace(/\s/g, '');
            if (this.isValidBase64(cleanBase64)) {
              qrCodeData = `data:image/png;base64,${cleanBase64}`;
            }
          }
          break;
        }
      }
      
      if (qrCodeData) {
        return {
          success: true,
          qrCode: qrCodeData,
          pairingCode: result.pairingCode || result.pairing_code
        };
      } else {
        console.error('❌ [EVOLUTION_API] QR Code não encontrado na resposta');
        return { 
          success: false, 
          error: 'QR Code não encontrado na resposta da API'
        };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  private isValidBase64(str: string): boolean {
    if (!str || str.length < 4) return false;
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str);
  }

  async getConnectionStatus(): Promise<InstanceStatus | null> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`🔍 [EVOLUTION_API] Verificando status da instância: ${normalizedName}`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${normalizedName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao verificar status: ${response.status} - ${errorText}`);
        return { state: 'close' };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Status da instância:`, result);
      
      return {
        state: result.instance?.state || result.state || 'close',
        qrCode: result.qrCode
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao verificar status:', error);
      return { state: 'close' };
    }
  }

  async sendTextMessage(phoneNumber: string, text: string): Promise<MessageResponse> {
    try {
      console.log(`📤 [EVOLUTION_API] Enviando mensagem de texto para: ${phoneNumber}`);
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${this.config.baseUrl}/message/sendText/${this.config.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: text,
          delay: 1200
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao enviar mensagem: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Mensagem enviada:`, result);
      
      return {
        success: true,
        messageId: result.key?.id
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  async sendSticker(phoneNumber: string, stickerBase64: string): Promise<MessageResponse> {
    try {
      console.log(`📤 [EVOLUTION_API] Enviando sticker para: ${phoneNumber}`);
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const processedBase64 = this.processBase64ForSending(stickerBase64);
      
      const response = await fetch(`${this.config.baseUrl}/message/sendMedia/${this.config.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: formattedNumber,
          mediatype: 'sticker',
          media: processedBase64,
          delay: 1200
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao enviar sticker: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Sticker enviado:`, result);
      
      return {
        success: true,
        messageId: result.key?.id
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar sticker:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  async sendMediaMessage(
    phoneNumber: string, 
    mediaBase64: string, 
    mediaType: 'image' | 'audio' | 'video' | 'document',
    caption?: string,
    fileName?: string
  ): Promise<MessageResponse> {
    try {
      console.log(`📤 [EVOLUTION_API] Enviando ${mediaType} para: ${phoneNumber}`);
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const processedBase64 = this.processBase64ForSending(mediaBase64);
      
      let endpoint = '';
      let payload: any = {
        number: formattedNumber,
        delay: 1200
      };

      if (mediaType === 'audio') {
        endpoint = `/message/sendWhatsAppAudio/${this.config.instanceName}`;
        payload.audio = processedBase64;
      } else {
        endpoint = `/message/sendMedia/${this.config.instanceName}`;
        payload.mediatype = mediaType;
        payload.media = processedBase64;
        if (caption) payload.caption = caption;
        if (fileName) payload.fileName = fileName;
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
        console.error(`❌ [EVOLUTION_API] Erro ao enviar ${mediaType}: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] ${mediaType} enviado:`, result);
      
      return {
        success: true,
        messageId: result.key?.id
      };
    } catch (error) {
      console.error(`❌ [EVOLUTION_API] Erro ao enviar ${mediaType}:`, error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  private processBase64ForSending(base64Content: string): string {
    // Se já é uma data URL, extrair apenas o base64
    if (base64Content.startsWith('data:')) {
      const parts = base64Content.split(',');
      return parts.length > 1 ? parts[1] : base64Content;
    }
    
    // Limpar espaços e quebras de linha
    let cleanBase64 = base64Content.replace(/\s/g, '');
    
    // Adicionar padding se necessário
    const paddingNeeded = 4 - (cleanBase64.length % 4);
    if (paddingNeeded < 4) {
      cleanBase64 += '='.repeat(paddingNeeded);
    }
    
    return cleanBase64;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = ('' + phoneNumber).replace(/\D/g, '');

    // Se já começa com 55 (código do Brasil)
    if (cleaned.startsWith('55')) {
      // Verificar se é um número válido
      if (cleaned.length >= 12 && cleaned.length <= 13) {
        return cleaned;
      }
    }
    
    // Se é um número brasileiro sem código do país
    if (cleaned.length >= 10 && cleaned.length <= 11) {
      return '55' + cleaned;
    }
    
    // Se é muito curto, pode ser um número local
    if (cleaned.length === 8 || cleaned.length === 9) {
      // Assumir DDD padrão (ajustar conforme necessário)
      return '5511' + cleaned;
    }
    
    // Se não se encaixa nos padrões, retornar como está
    return cleaned;
  }

  // Inicializar WebSocket após conectar instância
  async initializeWebSocket(): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`🔌 [EVOLUTION_API] Inicializando WebSocket para: ${normalizedName}`);
      
      // Primeiro configurar WebSocket na Evolution API
      const configResult = await this.configureWebSocket(normalizedName);
      
      if (!configResult.success) {
        return configResult;
      }
      
      // Conectar WebSocket local (será implementado no próximo arquivo)
      console.log(`✅ [EVOLUTION_API] WebSocket configurado, pronto para conexão local`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao inicializar WebSocket:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }
}

// Evolution API Manager class for managing multiple instances
class EvolutionApiManager {
  private instances: Map<string, EvolutionApiService> = new Map();

  addInstance(key: string, config: EvolutionApiConfig): EvolutionApiService {
    const service = new EvolutionApiService(config);
    this.instances.set(key, service);
    return service;
  }

  getInstance(key: string): EvolutionApiService | undefined {
    return this.instances.get(key);
  }

  getInstanceByConfig(config: EvolutionApiConfig): EvolutionApiService {
    const key = `${config.baseUrl}_${config.instanceName}`;
    let instance = this.getInstance(key);
    
    if (!instance) {
      instance = this.addInstance(key, config);
    }
    
    return instance;
  }

  removeInstance(key: string): boolean {
    return this.instances.delete(key);
  }

  getAllInstances(): EvolutionApiService[] {
    return Array.from(this.instances.values());
  }

  clear(): void {
    this.instances.clear();
  }
}

// Export singleton instance
export const evolutionApiManager = new EvolutionApiManager();
