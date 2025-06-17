// Mantendo toda funcionalidade existente da API Evolution
import { supabase } from '@/integrations/supabase/client';
import { N8nMessagingService } from './N8nMessagingService';

export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

interface SendMessageResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface ConnectionResult {
  connected: boolean;
  state?: string;
  error?: string;
}

interface QRCodeResult {
  qrCode?: string;
  pairingCode?: string;
  error?: string;
}

// Interface para informações da instância
export interface InstanceInfo {
  instanceName: string;
  status: string;
  serverUrl: string;
  apikey: string;
  owner: string;
  profileName?: string;
  profilePictureUrl?: string;
  integration: string;
  number?: string;
  connectionStatus: string;
}

export class EvolutionApiService {
  private config: EvolutionApiConfig;

  // Mapeamento dos Webhooks N8N por Canal
  private static readonly N8N_WEBHOOK_MAPPINGS: { [key: string]: string } = {
    "Yelena": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd1w13we",
    "Canarana": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd21",
    "Souto Soares": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd23",
    "João Dourado": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd123",
    "Gerente das Lojas": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd12345",
    "Gerente do Externo": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd324",
    "América Dourada": "https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd34",
  };

  // WEBHOOK UNIVERSAL PARA TODOS OS CANAIS
  private static readonly UNIVERSAL_WEBHOOK = 'https://n8n.estudioonmp.com/webhook/3a0b2487-21d0-43c7-bc7f-07404879df5434232';

  constructor(config: EvolutionApiConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    };
  }

  /**
   * Lista todas as instâncias
   */
  listInstances = async (): Promise<{ success: boolean; instances?: InstanceInfo[]; error?: string }> => {
    try {
      console.log('📋 [EVOLUTION_API] Listando instâncias');

      const url = `${this.config.baseUrl}/instance/fetchInstances`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('📋 [EVOLUTION_API] Resultado:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao listar instâncias' };
      }

      return { success: true, instances: result.results || [] };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Valida a conexão com a API
   */
  validateApi = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔍 [EVOLUTION_API] Validando API');

      const url = `${this.config.baseUrl}/instance/fetchInstances`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao validar API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Configura webhook universal para TODOS os canais
   */
  setWebhook = async (webhookUrl?: string, events?: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      // Usar webhook universal se não especificado
      const finalWebhookUrl = webhookUrl || EvolutionApiService.UNIVERSAL_WEBHOOK;
      const finalEvents = events || ["WEBHOOK_BASE64", "MESSAGES_UPSERT", "GROUPS_UPSERT"];
      
      console.log('🔗 [EVOLUTION_API] Configurando webhook universal:', finalWebhookUrl);

      const url = `${this.config.baseUrl}/webhook/set/${this.config.instanceName}`;
      const payload = {
        webhookUrl: finalWebhookUrl,
        events: finalEvents,
        enabled: true,
        webhookBase64: true
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Webhook universal configurado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém configuração atual do webhook
   */
  getWebhook = async (): Promise<{ success: boolean; webhook?: any; error?: string }> => {
    try {
      console.log('🔍 [EVOLUTION_API] Obtendo webhook');

      const url = `${this.config.baseUrl}/webhook/find/${this.config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter webhook:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('🔍 [EVOLUTION_API] Webhook:', result);

      return { success: true, webhook: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Configura o webhook para um canal específico na Evolution API.
   */
  setWebhookForChannel = async (channelName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const webhookUrl = EvolutionApiService.N8N_WEBHOOK_MAPPINGS[channelName];
      if (!webhookUrl) {
        return { success: false, error: `Webhook URL não encontrado para o canal: ${channelName}` };
      }

      console.log(`🔗 [EVOLUTION_API] Configurando webhook para o canal ${channelName}: ${webhookUrl}`);

      const url = `${this.config.baseUrl}/webhook/set/${this.config.instanceName}`;
      const payload = {
        webhookUrl: webhookUrl,
        events: ["WEBHOOK_BASE64", "MESSAGES_UPSERT", "GROUPS_UPSERT"],
        enabled: true,
        webhookBase64: true // Habilitar WEBHOOK_BASE64
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Webhook configurado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de texto usando N8N (método legado mantido para compatibilidade)
   * @deprecated Use N8nMessagingService.sendTextMessage diretamente
   */
  sendTextMessage = async (phoneNumber: string, message: string): Promise<SendMessageResult> => {
    console.warn('⚠️ [EVOLUTION_API] Método legado sendTextMessage chamado, redirecionando para N8N');
    
    // Buscar mapping para obter nome do canal
    const { data: mapping, error: mappingError } = await supabase
      .from('channel_instance_mappings')
      .select('*')
      .eq('instance_name', this.config.instanceName)
      .maybeSingle();

    if (mappingError || !mapping) {
      console.error('❌ [EVOLUTION_API] Mapping não encontrado para instância:', this.config.instanceName);
      return { success: false, error: 'Mapping não encontrado para a instância' };
    }

    // Redirecionar para N8N
    const result = await N8nMessagingService.sendTextMessage(
      mapping.channel_name,
      this.config.instanceName,
      phoneNumber,
      message
    );

    return {
      success: result.success,
      messageId: result.success ? Date.now().toString() : undefined,
      error: result.error
    };
  };

  /**
   * Envia uma mensagem de mídia usando N8N (método legado mantido para compatibilidade)
   * @deprecated Use N8nMessagingService.sendMediaMessage diretamente
   */
  sendMediaMessage = async (
    phoneNumber: string,
    mediaUrl: string,
    caption: string,
    mediaType: 'image' | 'audio' | 'video' | 'document'
  ): Promise<SendMessageResult> => {
    console.warn('⚠️ [EVOLUTION_API] Método legado sendMediaMessage chamado, redirecionando para N8N');
    
    // Buscar mapping para obter nome do canal
    const { data: mapping, error: mappingError } = await supabase
      .from('channel_instance_mappings')
      .select('*')
      .eq('instance_name', this.config.instanceName)
      .maybeSingle();

    if (mappingError || !mapping) {
      console.error('❌ [EVOLUTION_API] Mapping não encontrado para instância:', this.config.instanceName);
      return { success: false, error: 'Mapping não encontrado para a instância' };
    }

    // Redirecionar para N8N
    const result = await N8nMessagingService.sendMediaMessage(
      mapping.channel_name,
      this.config.instanceName,
      phoneNumber,
      mediaUrl,
      caption,
      mediaType
    );

    return {
      success: result.success,
      messageId: result.success ? Date.now().toString() : undefined,
      error: result.error
    };
  };

  /**
   * Obtém o QR Code para conectar a instância
   */
  getQRCodeForInstance = async (instanceName?: string): Promise<{ success: boolean; qrCode?: string; pairingCode?: string; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🔲 [EVOLUTION_API] Obtendo QR Code para:', instance);

      const url = `${this.config.baseUrl}/instance/connect/${instance}`;
      console.log('🔲 [EVOLUTION_API] URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      console.log('🔲 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🔲 [EVOLUTION_API] Resultado:', result);

      // Diferentes formatos de resposta possíveis
      let qrCode = '';
      if (result.base64) {
        qrCode = result.base64;
      } else if (result.code) {
        qrCode = result.code;
      } else if (result.qrcode) {
        qrCode = result.qrcode;
      } else if (result.qr) {
        qrCode = result.qr;
      } else {
        console.error('❌ [EVOLUTION_API] Formato de resposta inesperado:', result);
        return { 
          success: false,
          error: 'QR Code não encontrado na resposta da API' 
        };
      }

      return { 
        success: true,
        qrCode: qrCode,
        pairingCode: result.pairingCode 
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  /**
   * Verifica o status de conexão da instância
   */
  getConnectionStatus = async (instanceName?: string): Promise<{ success: boolean; connected: boolean; state?: string; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🔍 [EVOLUTION_API] Verificando status de conexão para:', instance);

      const url = `${this.config.baseUrl}/instance/connectionState/${instance}`;
      console.log('🔍 [EVOLUTION_API] URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      console.log('🔍 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
        return {
          success: false,
          connected: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🔍 [EVOLUTION_API] Resultado:', result);

      // Verificar diferentes formatos de resposta
      let state = '';
      if (result.state) {
        state = result.state;
      } else if (result.instance?.state) {
        state = result.instance.state;
      } else if (result.connectionState) {
        state = result.connectionState;
      }

      const isConnected = state === 'open';

      return {
        success: true,
        connected: isConnected,
        state: state,
        error: result.error
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao verificar status:', error);
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Reinicia uma instância
   */
  restartInstance = async (instanceName?: string): Promise<boolean> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🔄 [EVOLUTION_API] Reiniciando instância:', instance);

      const url = `${this.config.baseUrl}/instance/restart/${instance}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ [EVOLUTION_API] Erro ao reiniciar:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('🔄 [EVOLUTION_API] Resultado:', result);

      return result.status !== 'error';

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao reiniciar instância:', error);
      return false;
    }
  }

  /**
   * Faz logout de uma instância
   */
  logoutInstance = async (instanceName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🚪 [EVOLUTION_API] Fazendo logout da instância:', instance);

      const url = `${this.config.baseUrl}/instance/logout/${instance}`;

      const response = await fetch(url, {
        method: 'DELETE',  // Mudando de POST para DELETE
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao fazer logout:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🚪 [EVOLUTION_API] Resultado:', result);

      if (result.status === 'error') {
        return {
          success: false,
          error: result.message || 'Erro ao fazer logout'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao fazer logout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Cria uma nova instância (versão simples para compatibilidade)
   */
  createInstanceSimple = async (instanceName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('➕ [EVOLUTION_API] Criando instância (simples):', instanceName);

      const url = `${this.config.baseUrl}/instance/create`;

      // Payload correto conforme documentação v2
      const payload = {
        instanceName: instanceName,
        integration: "WHATSAPP-BAILEYS", // Campo obrigatório
        token: this.config.apiKey
      };

      console.log('➕ [EVOLUTION_API] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      console.log('➕ [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao criar instância:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('➕ [EVOLUTION_API] Resultado:', result);

      if (result.status === 'error') {
        return {
          success: false,
          error: result.message || 'Erro ao criar instância'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar instância:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Deleta uma instância (versão simples para compatibilidade)
   */
  deleteInstance = async (instanceName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🗑️ [EVOLUTION_API] Deletando instância:', instance);

      const url = `${this.config.baseUrl}/instance/delete/${instance}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao deletar instância:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🗑️ [EVOLUTION_API] Resultado:', result);

      if (result.status === 'error') {
        return {
          success: false,
          error: result.message || 'Erro ao deletar instância'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao deletar instância:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Lista todas as instâncias
   */
  fetchInstances = async (): Promise<any[]> => {
    try {
      console.log('📋 [EVOLUTION_API] Listando instâncias');

      const url = `${this.config.baseUrl}/instance/fetchInstances`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', response.status);
        return [];
      }

      const result = await response.json();
      console.log('📋 [EVOLUTION_API] Resultado:', result);

      if (result.status === 'error') {
        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', result.message);
        return [];
      }

      return result.results || [];

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return [];
    }
  };

  /**
   * Obtém informações detalhadas de uma instância
   */
  getInstanceInfo = async (instanceName?: string): Promise<InstanceInfo | null> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('ℹ️ [EVOLUTION_API] Obtendo informações da instância:', instance);

      const url = `${this.config.baseUrl}/instance/fetchInstances`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ [EVOLUTION_API] Erro ao obter informações da instância:', response.status);
        return null;
      }

      const result = await response.json();
      console.log('ℹ️ [EVOLUTION_API] Resultado:', result);

      if (result.status === 'error') {
        console.error('❌ [EVOLUTION_API] Erro ao obter informações da instância:', result.message);
        return null;
      }

      const instances: InstanceInfo[] = result.results || [];
      const foundInstance = instances.find(inst => inst.instanceName === instance);

      return foundInstance || null;

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter informações da instância:', error);
      return null;
    }
  };

  /**
   * Desabilita o webhook de uma instância
   */
  disableWebhook = async (instanceName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🚫 [EVOLUTION_API] Desabilitando webhook para:', instance);

      const url = `${this.config.baseUrl}/webhook/set/${instance}`;
      const payload = {
        enabled: false
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao desabilitar webhook:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Webhook desabilitado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao desabilitar webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };
}
