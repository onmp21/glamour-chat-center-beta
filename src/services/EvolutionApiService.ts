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
  public listInstances = async (): Promise<{ success: boolean; instances?: InstanceInfo[]; error?: string }> => {
    try {
      console.log("📋 [EVOLUTION_API] Listando instâncias");

      const url = `${this.config.baseUrl}/instance/fetchInstances`;
      console.log("📋 [EVOLUTION_API] URL de listagem de instâncias:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      console.log("📋 [EVOLUTION_API] Status da resposta de listInstances:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('📋 [EVOLUTION_API] Resultado bruto de listInstances:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao listar instâncias' };
      }

      // Verificar diferentes formatos de resposta da API Evolution
      let instances: InstanceInfo[] = [];
      
      if (Array.isArray(result)) {
        // Se o resultado é um array direto
        instances = result;
        console.log('📋 [EVOLUTION_API] Formato: Array direto, instâncias encontradas:', instances.length);
      } else if (result.results && Array.isArray(result.results)) {
        // Se o resultado tem uma propriedade 'results'
        instances = result.results;
        console.log('📋 [EVOLUTION_API] Formato: result.results, instâncias encontradas:', instances.length);
      } else if (result.data && Array.isArray(result.data)) {
        // Se o resultado tem uma propriedade 'data'
        instances = result.data;
        console.log('📋 [EVOLUTION_API] Formato: result.data, instâncias encontradas:', instances.length);
      } else if (result.instances && Array.isArray(result.instances)) {
        // Se o resultado tem uma propriedade 'instances'
        instances = result.instances;
        console.log('📋 [EVOLUTION_API] Formato: result.instances, instâncias encontradas:', instances.length);
      } else {
        console.warn('📋 [EVOLUTION_API] Formato de resposta não reconhecido:', result);
        instances = [];
      }

      console.log('📋 [EVOLUTION_API] Instâncias processadas:', instances);
      return { success: true, instances };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Valida a conexão com a API
   */
  public validateConnection = async (): Promise<{ success: boolean; error?: string }> => {
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
  public setWebhook = async (webhookUrl?: string, events?: string[]): Promise<{ success: boolean; error?: string }> => {
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
  public getWebhook = async (): Promise<{ success: boolean; webhook?: any; error?: string }> => {
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
  public setWebhookForChannel = async (channelName: string): Promise<{ success: boolean; error?: string }> => {
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
  public sendTextMessage = async (phoneNumber: string, message: string): Promise<SendMessageResult> => {
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
  public sendMediaMessage = async (
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
  public getQRCodeForInstance = async (instanceName?: string): Promise<{ success: boolean; qrCode?: string; pairingCode?: string; error?: string }> => {
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
  public getConnectionStatus = async (instanceName?: string): Promise<{ success: boolean; connected: boolean; state?: string; error?: string }> => {
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
        state: state
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao verificar status:', error);
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  /**
   * Cria uma nova instância simples
   */
  public createInstanceSimple = async (instanceName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`➕ [EVOLUTION_API] Criando instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/create`;
      const payload = {
        instanceName: instanceName,
        token: this.config.apiKey,
        integration: "WHATSAPP-BAILEYS" // Campo obrigatório para a API Evolution
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
        console.error('❌ [EVOLUTION_API] Erro ao criar instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Instância criada com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Deleta uma instância
   */
  public deleteInstance = async (instanceName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log(`🗑️ [EVOLUTION_API] Deletando instância: ${instance}`);

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
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Instância deletada com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao deletar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Desconecta uma instância
   */
  public disconnectInstance = async (instanceName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔌 [EVOLUTION_API] Desconectando instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/disconnect/${instanceName}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao desconectar instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Instância desconectada com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao desconectar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Reinicia uma instância
   */
  public restartInstance = async (instanceName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔄 [EVOLUTION_API] Reiniciando instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/restart/${instanceName}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao reiniciar instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Instância reiniciada com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao reiniciar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Cria uma nova instância com configurações avançadas
   */
  public createInstanceAdvanced = async (instanceName: string, options: any): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`➕ [EVOLUTION_API] Criando instância avançada: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/create`;
      const payload = {
        instanceName: instanceName,
        token: this.config.apiKey,
        ...options
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
        console.error('❌ [EVOLUTION_API] Erro ao criar instância avançada:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Instância avançada criada com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar instância avançada:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém informações de uma instância específica
   */
  public getInstanceInfo = async (instanceName: string): Promise<{ success: boolean; instance?: InstanceInfo; error?: string }> => {
    try {
      console.log(`ℹ️ [EVOLUTION_API] Obtendo informações da instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/fetchInstance/${instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter informações da instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('ℹ️ [EVOLUTION_API] Informações da instância:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter informações da instância' };
      }

      // A API Evolution pode retornar a instância diretamente ou dentro de uma propriedade 'instance'
      const instanceData = result.instance || result;

      return { success: true, instance: instanceData };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter informações da instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de texto diretamente pela Evolution API
   */
  public sendTextMessageDirect = async (phoneNumber: string, message: string): Promise<SendMessageResult> => {
    try {
      console.log(`💬 [EVOLUTION_API] Enviando mensagem de texto para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendText/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        textMessage: { text: message }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de texto:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de texto enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de texto:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de mídia diretamente pela Evolution API
   */
  public sendMediaMessageDirect = async (
    phoneNumber: string,
    mediaUrl: string,
    caption: string,
    mediaType: 'image' | 'audio' | 'video' | 'document'
  ): Promise<SendMessageResult> => {
    try {
      console.log(`🖼️ [EVOLUTION_API] Enviando mensagem de mídia para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendMedia/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        options: {},
        mediaMessage: {
          mediatype: mediaType,
          media: mediaUrl,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de mídia:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de mídia enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de mídia:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de áudio diretamente pela Evolution API
   */
  public sendAudioMessageDirect = async (
    phoneNumber: string,
    audioUrl: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`🎤 [EVOLUTION_API] Enviando mensagem de áudio para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendAudio/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        audioMessage: {
          audio: audioUrl
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de áudio:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de áudio enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de áudio:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de arquivo diretamente pela Evolution API
   */
  public sendFileMessageDirect = async (
    phoneNumber: string,
    fileUrl: string,
    fileName: string,
    caption: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`📄 [EVOLUTION_API] Enviando mensagem de arquivo para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendFile/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        fileMessage: {
          file: fileUrl,
          fileName: fileName,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de arquivo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de arquivo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de arquivo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de localização diretamente pela Evolution API
   */
  public sendLocationMessageDirect = async (
    phoneNumber: string,
    latitude: number,
    longitude: number,
    name: string,
    address: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`📍 [EVOLUTION_API] Enviando mensagem de localização para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendLocation/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        locationMessage: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de localização:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de localização enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de localização:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de contato diretamente pela Evolution API
   */
  public sendContactMessageDirect = async (
    phoneNumber: string,
    contactName: string,
    contactVcard: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`👤 [EVOLUTION_API] Enviando mensagem de contato para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendContact/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        contactMessage: {
          contacts: [{
            displayName: contactName,
            vcard: contactVcard
          }]
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de contato:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de contato enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de contato:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de botão diretamente pela Evolution API
   */
  public sendButtonMessageDirect = async (
    phoneNumber: string,
    message: string,
    buttons: { id: string; text: string }[],
    footer?: string,
    title?: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`🔘 [EVOLUTION_API] Enviando mensagem de botão para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendButton/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        buttonMessage: {
          text: message,
          buttons: buttons,
          footer: footer,
          title: title
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de botão:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de botão enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de botão:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de lista diretamente pela Evolution API
   */
  public sendListMessageDirect = async (
    phoneNumber: string,
    message: string,
    sections: any[],
    buttonText: string,
    footer?: string,
    title?: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`📄 [EVOLUTION_API] Enviando mensagem de lista para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendList/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        listMessage: {
          text: message,
          sections: sections,
          buttonText: buttonText,
          footer: footer,
          title: title
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de lista:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de lista enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de lista:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Marca mensagens como lidas
   */
  public markMessagesAsRead = async (messageIds: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`👁️ [EVOLUTION_API] Marcando mensagens como lidas: ${messageIds.join(', ')}`);

      const url = `${this.config.baseUrl}/message/readMessages/${this.config.instanceName}`;
      const payload = {
        messageIds: messageIds
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
        console.error('❌ [EVOLUTION_API] Erro ao marcar mensagens como lidas:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagens marcadas como lidas com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao marcar mensagens como lidas:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um visto por último (read receipt)
   */
  public sendReadReceipt = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`✅ [EVOLUTION_API] Enviando visto por último para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendReadReceipt/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar visto por último:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Visto por último enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar visto por último:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um typing status (digitando)
   */
  public sendTypingStatus = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`✍️ [EVOLUTION_API] Enviando typing status para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendTyping/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar typing status:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Typing status enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar typing status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um recording status (gravando áudio)
   */
  public sendRecordingStatus = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🎙️ [EVOLUTION_API] Enviando recording status para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendRecording/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar recording status:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Recording status enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar recording status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém todos os contatos
   */
  public getAllContacts = async (): Promise<{ success: boolean; contacts?: any[]; error?: string }> => {
    try {
      console.log('👥 [EVOLUTION_API] Obtendo todos os contatos');

      const url = `${this.config.baseUrl}/contacts/findAllContacts/${this.config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter contatos:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('👥 [EVOLUTION_API] Contatos:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter contatos' };
      }

      return { success: true, contacts: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter contatos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Bloqueia um contato
   */
  public blockContact = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🚫 [EVOLUTION_API] Bloqueando contato: ${phoneNumber}`);

      const url = `${this.config.baseUrl}/contacts/blockContact/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao bloquear contato:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Contato bloqueado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao bloquear contato:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Desbloqueia um contato
   */
  public unblockContact = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔓 [EVOLUTION_API] Desbloqueando contato: ${phoneNumber}`);

      const url = `${this.config.baseUrl}/contacts/unblockContact/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao desbloquear contato:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Contato desbloqueado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao desbloquear contato:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém todas as mensagens
   */
  public getAllMessages = async (): Promise<{ success: boolean; messages?: any[]; error?: string }> => {
    try {
      console.log('✉️ [EVOLUTION_API] Obtendo todas as mensagens');

      const url = `${this.config.baseUrl}/message/findAllMessages/${this.config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter mensagens:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✉️ [EVOLUTION_API] Mensagens:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter mensagens' };
      }

      return { success: true, messages: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter mensagens:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém todas as conversas
   */
  public getAllConversations = async (): Promise<{ success: boolean; conversations?: any[]; error?: string }> => {
    try {
      console.log('💬 [EVOLUTION_API] Obtendo todas as conversas');

      const url = `${this.config.baseUrl}/chat/findAllChats/${this.config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter conversas:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('💬 [EVOLUTION_API] Conversas:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter conversas' };
      }

      return { success: true, conversations: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter conversas:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém mensagens de uma conversa específica
   */
  public getMessagesByConversation = async (phoneNumber: string): Promise<{ success: boolean; messages?: any[]; error?: string }> => {
    try {
      console.log(`✉️ [EVOLUTION_API] Obtendo mensagens para a conversa: ${phoneNumber}`);

      const url = `${this.config.baseUrl}/chat/fetchMessagesByContact/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao obter mensagens da conversa:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✉️ [EVOLUTION_API] Mensagens da conversa:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter mensagens da conversa' };
      }

      return { success: true, messages: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter mensagens da conversa:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém informações do perfil de um contato
   */
  public getContactProfile = async (phoneNumber: string): Promise<{ success: boolean; profile?: any; error?: string }> => {
    try {
      console.log(`👤 [EVOLUTION_API] Obtendo perfil do contato: ${phoneNumber}`);

      const url = `${this.config.baseUrl}/contacts/fetchContact/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber
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
        console.error('❌ [EVOLUTION_API] Erro ao obter perfil do contato:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('👤 [EVOLUTION_API] Perfil do contato:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter perfil do contato' };
      }

      return { success: true, profile: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter perfil do contato:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um áudio com áudio base64
   */
  public sendAudioBase64 = async (phoneNumber: string, base64Audio: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🎤 [EVOLUTION_API] Enviando áudio base64 para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendAudioBase64/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        audioMessage: {
          audio: base64Audio
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar áudio base64:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Áudio base64 enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar áudio base64:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma imagem com imagem base64
   */
  public sendImageBase64 = async (phoneNumber: string, base64Image: string, caption?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🖼️ [EVOLUTION_API] Enviando imagem base64 para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendImageBase64/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        imageMessage: {
          image: base64Image,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar imagem base64:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Imagem base64 enviada com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar imagem base64:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um vídeo com vídeo base64
   */
  public sendVideoBase64 = async (phoneNumber: string, base64Video: string, caption?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🎥 [EVOLUTION_API] Enviando vídeo base64 para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendVideoBase64/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        videoMessage: {
          video: base64Video,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar vídeo base64:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Vídeo base64 enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar vídeo base64:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um documento com documento base64
   */
  public sendDocumentBase64 = async (phoneNumber: string, base64Document: string, fileName: string, caption?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`📄 [EVOLUTION_API] Enviando documento base64 para ${phoneNumber}`);

      const url = `${this.config.baseUrl}/message/sendDocumentBase64/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        documentMessage: {
          document: base64Document,
          fileName: fileName,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar documento base64:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Documento base64 enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar documento base64:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém o perfil da instância
   */
  public getInstanceProfile = async (instanceName?: string): Promise<{ success: boolean; profile?: any; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log(`👤 [EVOLUTION_API] Obtendo perfil da instância: ${instance}`);

      const url = `${this.config.baseUrl}/instance/profile/${instance}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter perfil da instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('👤 [EVOLUTION_API] Perfil da instância:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter perfil da instância' };
      }

      return { success: true, profile: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter perfil da instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Atualiza o perfil da instância
   */
  public updateInstanceProfile = async (instanceName: string, profileData: { name?: string; status?: string; picture?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`📝 [EVOLUTION_API] Atualizando perfil da instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/updateProfile/${instanceName}`;
      const payload = profileData;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao atualizar perfil da instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Perfil da instância atualizado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao atualizar perfil da instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém as configurações da instância
   */
  public getInstanceSettings = async (instanceName?: string): Promise<{ success: boolean; settings?: any; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log(`⚙️ [EVOLUTION_API] Obtendo configurações da instância: ${instance}`);

      const url = `${this.config.baseUrl}/instance/settings/${instance}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter configurações da instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('⚙️ [EVOLUTION_API] Configurações da instância:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter configurações da instância' };
      }

      return { success: true, settings: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter configurações da instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Atualiza as configurações da instância
   */
  public updateInstanceSettings = async (instanceName: string, settingsData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`⚙️ [EVOLUTION_API] Atualizando configurações da instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/instance/updateSettings/${instanceName}`;
      const payload = settingsData;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao atualizar configurações da instância:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Configurações da instância atualizadas com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao atualizar configurações da instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Reinicia o webhook da instância
   */
  public restartWebhook = async (instanceName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔄 [EVOLUTION_API] Reiniciando webhook da instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/webhook/restart/${instanceName}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao reiniciar webhook:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Webhook reiniciado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao reiniciar webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém o status do webhook da instância
   */
  public getWebhookStatus = async (instanceName: string): Promise<{ success: boolean; status?: any; error?: string }> => {
    try {
      console.log(`🔍 [EVOLUTION_API] Obtendo status do webhook da instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/webhook/status/${instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter status do webhook:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('🔍 [EVOLUTION_API] Status do webhook:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter status do webhook' };
      }

      return { success: true, status: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter status do webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Limpa todos os webhooks da instância
   */
  public clearAllWebhooks = async (instanceName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🧹 [EVOLUTION_API] Limpando todos os webhooks da instância: ${instanceName}`);

      const url = `${this.config.baseUrl}/webhook/clear/${instanceName}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao limpar webhooks:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Webhooks limpos com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao limpar webhooks:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia um template de mensagem
   */
  public sendTemplateMessage = async (phoneNumber: string, templateName: string, variables: any[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`📝 [EVOLUTION_API] Enviando template de mensagem para ${phoneNumber}: ${templateName}`);

      const url = `${this.config.baseUrl}/message/sendTemplate/${this.config.instanceName}`;
      const payload = {
        number: phoneNumber,
        templateMessage: {
          name: templateName,
          language: { code: 'pt_BR' }, // Default para português do Brasil
          components: variables.map(v => ({ type: 'body', parameters: [{ type: 'text', text: v }] }))
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar template de mensagem:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Template de mensagem enviado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar template de mensagem:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém todos os grupos
   */
  public getAllGroups = async (): Promise<{ success: boolean; groups?: any[]; error?: string }> => {
    try {
      console.log('👥 [EVOLUTION_API] Obtendo todos os grupos');

      const url = `${this.config.baseUrl}/group/findAllGroups/${this.config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter grupos:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('👥 [EVOLUTION_API] Grupos:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter grupos' };
      }

      return { success: true, groups: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter grupos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Cria um novo grupo
   */
  public createGroup = async (groupName: string, participants: string[]): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    try {
      console.log(`➕ [EVOLUTION_API] Criando grupo: ${groupName}`);

      const url = `${this.config.baseUrl}/group/createGroup/${this.config.instanceName}`;
      const payload = {
        groupName: groupName,
        participants: participants
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
        console.error('❌ [EVOLUTION_API] Erro ao criar grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Grupo criado com sucesso:', result);
      return { success: true, groupId: result.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao criar grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Adiciona participantes a um grupo
   */
  public addParticipantsToGroup = async (groupId: string, participants: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`➕ [EVOLUTION_API] Adicionando participantes ao grupo ${groupId}: ${participants.join(', ')}`);

      const url = `${this.config.baseUrl}/group/addParticipants/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        participants: participants
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
        console.error('❌ [EVOLUTION_API] Erro ao adicionar participantes ao grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Participantes adicionados com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao adicionar participantes ao grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Remove participantes de um grupo
   */
  public removeParticipantsFromGroup = async (groupId: string, participants: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`➖ [EVOLUTION_API] Removendo participantes do grupo ${groupId}: ${participants.join(', ')}`);

      const url = `${this.config.baseUrl}/group/removeParticipants/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        participants: participants
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
        console.error('❌ [EVOLUTION_API] Erro ao remover participantes do grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Participantes removidos com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao remover participantes do grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Promove participantes a administradores do grupo
   */
  public promoteParticipantsToAdmin = async (groupId: string, participants: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`👑 [EVOLUTION_API] Promovendo participantes a administradores no grupo ${groupId}: ${participants.join(', ')}`);

      const url = `${this.config.baseUrl}/group/promoteParticipants/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        participants: participants
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
        console.error('❌ [EVOLUTION_API] Erro ao promover participantes:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Participantes promovidos com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao promover participantes:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Rebaixa administradores do grupo a participantes
   */
  public demoteParticipantsFromAdmin = async (groupId: string, participants: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`⬇️ [EVOLUTION_API] Rebaixando administradores no grupo ${groupId}: ${participants.join(', ')}`);

      const url = `${this.config.baseUrl}/group/demoteParticipants/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        participants: participants
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
        console.error('❌ [EVOLUTION_API] Erro ao rebaixar administradores:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Administradores rebaixados com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao rebaixar administradores:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém o link de convite do grupo
   */
  public getGroupInviteLink = async (groupId: string): Promise<{ success: boolean; inviteLink?: string; error?: string }> => {
    try {
      console.log(`🔗 [EVOLUTION_API] Obtendo link de convite para o grupo: ${groupId}`);

      const url = `${this.config.baseUrl}/group/getInviteLink/${this.config.instanceName}`;
      const payload = {
        groupId: groupId
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
        console.error('❌ [EVOLUTION_API] Erro ao obter link de convite:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('🔗 [EVOLUTION_API] Link de convite:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter link de convite' };
      }

      return { success: true, inviteLink: result.inviteLink };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter link de convite:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Revoga o link de convite do grupo
   */
  public revokeGroupInviteLink = async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🚫 [EVOLUTION_API] Revogando link de convite para o grupo: ${groupId}`);

      const url = `${this.config.baseUrl}/group/revokeInviteLink/${this.config.instanceName}`;
      const payload = {
        groupId: groupId
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
        console.error('❌ [EVOLUTION_API] Erro ao revogar link de convite:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Link de convite revogado com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao revogar link de convite:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Obtém informações do grupo
   */
  public getGroupInfo = async (groupId: string): Promise<{ success: boolean; group?: any; error?: string }> => {
    try {
      console.log(`ℹ️ [EVOLUTION_API] Obtendo informações do grupo: ${groupId}`);

      const url = `${this.config.baseUrl}/group/findGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId
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
        console.error('❌ [EVOLUTION_API] Erro ao obter informações do grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('ℹ️ [EVOLUTION_API] Informações do grupo:', result);

      if (result.status === 'error') {
        return { success: false, error: result.message || 'Erro ao obter informações do grupo' };
      }

      return { success: true, group: result };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao obter informações do grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Deixa um grupo
   */
  public leaveGroup = async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🚪 [EVOLUTION_API] Saindo do grupo: ${groupId}`);

      const url = `${this.config.baseUrl}/group/leaveGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId
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
        console.error('❌ [EVOLUTION_API] Erro ao sair do grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Saiu do grupo com sucesso:', result);
      return { success: true };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao sair do grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de texto para um grupo
   */
  public sendGroupTextMessage = async (groupId: string, message: string): Promise<SendMessageResult> => {
    try {
      console.log(`💬 [EVOLUTION_API] Enviando mensagem de texto para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendTextGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        textMessage: { text: message }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de texto para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de texto para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de texto para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de mídia para um grupo
   */
  public sendGroupMediaMessage = async (
    groupId: string,
    mediaUrl: string,
    caption: string,
    mediaType: 'image' | 'audio' | 'video' | 'document'
  ): Promise<SendMessageResult> => {
    try {
      console.log(`🖼️ [EVOLUTION_API] Enviando mensagem de mídia para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendMediaGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        options: {},
        mediaMessage: {
          mediatype: mediaType,
          media: mediaUrl,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de mídia para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de mídia para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de mídia para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de áudio para um grupo
   */
  public sendGroupAudioMessage = async (
    groupId: string,
    audioUrl: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`🎤 [EVOLUTION_API] Enviando mensagem de áudio para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendAudioGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        audioMessage: {
          audio: audioUrl
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de áudio para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de áudio para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de áudio para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de arquivo para um grupo
   */
  public sendGroupFileMessage = async (
    groupId: string,
    fileUrl: string,
    fileName: string,
    caption: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`📄 [EVOLUTION_API] Enviando mensagem de arquivo para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendFileGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        fileMessage: {
          file: fileUrl,
          fileName: fileName,
          caption: caption
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de arquivo para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de arquivo para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de arquivo para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de localização para um grupo
   */
  public sendGroupLocationMessage = async (
    groupId: string,
    latitude: number,
    longitude: number,
    name: string,
    address: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`📍 [EVOLUTION_API] Enviando mensagem de localização para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendLocationGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        locationMessage: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de localização para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de localização para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };
     } catch (error) {
      console.error("❌ [EVOLUTION_API] Erro ao enviar mensagem de localização para o grupo:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de contato para um grupo
   */
  public sendGroupContactMessage = async (
    groupId: string,
    contactName: string,
    contactVcard: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`👤 [EVOLUTION_API] Enviando mensagem de contato para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendContactGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        contactMessage: {
          contacts: [{
            displayName: contactName,
            vcard: contactVcard
          }]
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de contato para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de contato para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de contato para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de botão para um grupo
   */
  public sendGroupButtonMessage = async (
    groupId: string,
    message: string,
    buttons: { id: string; text: string }[],
    footer?: string,
    title?: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`🔘 [EVOLUTION_API] Enviando mensagem de botão para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendButtonGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        buttonMessage: {
          text: message,
          buttons: buttons,
          footer: footer,
          title: title
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de botão para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de botão para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de botão para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  /**
   * Envia uma mensagem de lista para um grupo
   */
  public sendGroupListMessage = async (
    groupId: string,
    message: string,
    sections: any[],
    buttonText: string,
    footer?: string,
    title?: string
  ): Promise<SendMessageResult> => {
    try {
      console.log(`📄 [EVOLUTION_API] Enviando mensagem de lista para o grupo ${groupId}`);

      const url = `${this.config.baseUrl}/message/sendListGroup/${this.config.instanceName}`;
      const payload = {
        groupId: groupId,
        listMessage: {
          text: message,
          sections: sections,
          buttonText: buttonText,
          footer: footer,
          title: title
        }
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
        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de lista para o grupo:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] Mensagem de lista para o grupo enviada com sucesso:', result);
      return { success: true, messageId: result.key?.id };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem de lista para o grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };
}


