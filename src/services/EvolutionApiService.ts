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
  profileName: string;
  number: string;
  status: string;
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

      const response = await fetch(`${this.config.baseUrl}/check-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.status === 'CONNECTED') {
        console.log('✅ [EVOLUTION_API] API validada com sucesso!');
        return { success: true };
      } else {
        console.error('❌ [EVOLUTION_API] Falha na validação:', data);
        return { success: false, error: 'Falha ao validar a API' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao validar API:', error);
      return { success: false, error: `${error}` };
    }
  }

  async listInstances(): Promise<{ success: boolean; instances?: InstanceInfo[]; error?: string }> {
    try {
      console.log(`📋 [EVOLUTION_API] Listando instâncias em: ${this.config.baseUrl}`);

      const response = await fetch(`${this.config.baseUrl}/instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
          instanceName: item.instanceName,
          profileName: item.profileName,
          number: item.number,
          status: item.status
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
        body: JSON.stringify({ instanceName: normalizedName })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        console.log(`✅ [EVOLUTION_API] Instância criada com sucesso: ${normalizedName}`);
        return { success: true };
      } else {
        console.error('❌ [EVOLUTION_API] Falha ao criar instância:', data);
        return { success: false, error: data.message || 'Falha ao criar instância' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar instância:', error);
      return { success: false, error: `${error}` };
    }
  }

  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🗑️ [EVOLUTION_API] Excluindo instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/instance/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({ instanceName: normalizedName })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        console.log(`✅ [EVOLUTION_API] Instância excluída com sucesso: ${normalizedName}`);
        return { success: true };
      } else {
        console.error('❌ [EVOLUTION_API] Falha ao excluir instância:', data);
        return { success: false, error: data.message || 'Falha ao excluir instância' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao excluir instância:', error);
      return { success: false, error: `${error}` };
    }
  }

  async configureWebSocket(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`⚙️ [EVOLUTION_API] Configurando WebSocket para instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/webhook/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          instanceName: normalizedName,
          webhook: 'false' // Desabilitar webhook
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        console.log(`✅ [EVOLUTION_API] WebSocket configurado com sucesso para: ${normalizedName}`);
        return { success: true };
      } else {
        console.error('❌ [EVOLUTION_API] Falha ao configurar WebSocket:', data);
        return { success: false, error: data.message || 'Falha ao configurar WebSocket' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao configurar WebSocket:', error);
      return { success: false, error: `${error}` };
    }
  }

  async getQRCodeForInstance(instanceName: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      const normalizedName = this.normalizeInstanceName(instanceName);
      console.log(`🔍 [EVOLUTION_API] Obtendo QR Code para instância: ${normalizedName}`);

      const response = await fetch(`${this.config.baseUrl}/instance/connect/${normalizedName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.base64) {
        console.log('✅ [EVOLUTION_API] QR Code obtido com sucesso');
        return { success: true, qrCode: data.base64 };
      } else {
        console.log('⚠️ [EVOLUTION_API] QR Code não disponível na resposta');
        return { success: false, error: 'QR Code não disponível' };
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error);
      return { success: false, error: `${error}` };
    }
  }
}

export const evolutionApiManager = {
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
          options: {
            delay: 1200,
            presence: 'composing'
          },
          text: message
        })
      });

      if (!response.ok) {
        console.error(`Erro ao enviar mensagem para ${chatId}: ${response.status} - ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      if (data.status === 'success') {
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
