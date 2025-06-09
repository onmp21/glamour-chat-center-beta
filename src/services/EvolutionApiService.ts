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

  // Configurar WebSocket para instância (substitui webhook)
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
        instance.instance.instanceName === normalizedName
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
      
      // Tentar diferentes formatos de resposta
      let qrCodeData = null;
      
      console.log(`🔍 [EVOLUTION_API] Campos disponíveis na resposta:`, Object.keys(result));
      
      // Verificar todos os possíveis campos de QR code
      const qrFields = ['base64', 'code', 'qrcode', 'qr', 'qrCode'];
      let rawQrData = null;
      
      for (const field of qrFields) {
        if (result[field]) {
          rawQrData = result[field];
          console.log(`🔍 [EVOLUTION_API] QR Code encontrado no campo '${field}':`, rawQrData.substring(0, 50) + '...');
          break;
        }
      }
      
      if (rawQrData) {
        // Verificar se já é uma data URL válida
        if (rawQrData.startsWith('data:image/')) {
          qrCodeData = rawQrData;
        } else if (rawQrData.startsWith('data:')) {
          // Se é data URL mas não especifica imagem, assumir PNG
          qrCodeData = rawQrData.replace('data:', 'data:image/png;base64,');
        } else {
          // Se é base64 puro, adicionar prefix
          // Limpar possíveis espaços e quebras de linha
          const cleanBase64 = rawQrData.replace(/\s/g, '');
          qrCodeData = `data:image/png;base64,${cleanBase64}`;
        }
        
        console.log(`✅ [EVOLUTION_API] QR Code formatado:`, qrCodeData.substring(0, 100) + '...');
      }
      
      if (qrCodeData) {
        return {
          success: true,
          qrCode: qrCodeData,
          pairingCode: result.pairingCode || result.pairing_code
        };
      } else {
        console.error('❌ [EVOLUTION_API] QR Code não encontrado na resposta:', Object.keys(result));
        return { 
          success: false, 
          error: 'QR Code não encontrado na resposta da API. Campos disponíveis: ' + Object.keys(result).join(', ')
        };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
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
      
      let endpoint = '';
      let payload: any = {
        number: formattedNumber,
        delay: 1200
      };

      if (mediaType === 'audio') {
        endpoint = `/message/sendWhatsAppAudio/${this.config.instanceName}`;
        payload.audio = mediaBase64;
      } else {
        endpoint = `/message/sendMedia/${this.config.instanceName}`;
        payload.mediatype = mediaType;
        payload.media = mediaBase64;
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

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = ('' + phoneNumber).replace(/\D/g, '');

    // Verifica se o número já começa com 55 (código do Brasil)
    if (cleaned.startsWith('55')) {
      // Se já tem 55, verifica se tem o nono dígito para celular (se for 11 dígitos após o 55)
      // E se não for um número fixo (que geralmente tem 8 dígitos após o 55)
      if (cleaned.length === 13 && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(cleaned[2])) {
        // Já está no formato 55XX9XXXXXXXX
        return cleaned;
      } else if (cleaned.length === 12) {
        // Pode ser um número fixo 55XXXXXXXXXX
        return cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('55') && !cleaned.startsWith('559')) {
        // Caso de números antigos sem o 9º dígito para DDDs que não eram 11, ou fixos
        // Ex: 55118xxxxxxx -> 551198xxxxxxx (se for celular)
        // Para simplificar, vamos assumir que se não tem 9 e tem 11 dígitos, é um fixo ou um celular antigo sem o 9
        // A API Evolution geralmente espera o 9 para celulares
        // Se for um DDD que não seja 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99
        // E o número tiver 8 dígitos após o DDD, é um fixo
        // Se tiver 9 dígitos após o DDD, é um celular
        // Para garantir, se for celular e não tiver o 9, adiciona-se
        // Esta lógica pode ser complexa e depender de uma base de dados de DDDs
        // Por simplicidade, se for 11 dígitos e não começar com 559, e for um celular, pode precisar do 9
        // A Evolution API geralmente lida com isso se o número for válido.
        return cleaned; // Retorna como está, a API deve lidar com isso
      }
    } else if (cleaned.length === 11 && cleaned.startsWith('9', 2)) { // Ex: 11987654321
      return '55' + cleaned;
    } else if (cleaned.length === 10) { // Ex: 1187654321 (fixo ou celular antigo)
      return '55' + cleaned;
    }
    
    // Se não se encaixa nos padrões acima, retorna o número limpo e a API Evolution deve validar
    return cleaned;
  }

  // Obter QR Code para conectar instância ao WhatsApp
  async getQRCodeForInstance(instanceName: string): Promise<QRCodeResponse> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`📱 [EVOLUTION_API] Obtendo QR Code para instância: ${normalizedName}`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/connect/${normalizedName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao obter QR Code: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] QR Code obtido:`, result);
      
      if (result.base64) {
        return {
          success: true,
          qrCode: result.base64
        };
      } else if (result.code) {
        return {
          success: true,
          qrCode: result.code
        };
      } else {
        return {
          success: false,
          error: 'QR Code não encontrado na resposta'
        };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }

  // Obter status da conexão da instância
  async getInstanceStatus(instanceName: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`📊 [EVOLUTION_API] Obtendo status da instância: ${normalizedName}`);
      
      const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${normalizedName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION_API] Erro ao obter status: ${response.status} - ${errorText}`);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ [EVOLUTION_API] Status obtido:`, result);
      
      return {
        success: true,
        status: result.state || result.status || 'unknown'
      };
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter status:', error);
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }


}

