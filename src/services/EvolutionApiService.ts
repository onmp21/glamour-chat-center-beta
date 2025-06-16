// Mantendo toda funcionalidade existente da API Evolution
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

  constructor(config: EvolutionApiConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    };
  }

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
   * Envia uma mensagem de texto usando a API Evolution v2
   */
  sendTextMessage = async (phoneNumber: string, message: string): Promise<SendMessageResult> => {
    try {
      console.log('📱 [EVOLUTION_API] Enviando mensagem de texto:', {
        instanceName: this.config.instanceName,
        phoneNumber,
        messageLength: message.length
      });

      const url = `${this.config.baseUrl}/message/sendText/${this.config.instanceName}`;
      
      // Formato correto conforme especificação
      const payload = {
        number: phoneNumber,
        text: message
      };

      console.log('📱 [EVOLUTION_API] URL:', url);
      console.log('📱 [EVOLUTION_API] Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      console.log('📱 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('📱 [EVOLUTION_API] Resultado:', result);

      // Verificar se a resposta está no formato esperado
      if (Array.isArray(result) && result.length > 0 && result[0].success) {
        return {
          success: true,
          messageId: result[0].data?.key?.id
        };
      }

      // Formato alternativo de resposta
      if (result.success) {
        return {
          success: true,
          messageId: result.data?.key?.id || result.key?.id
        };
      }

      if (result.status === 'error') {
        return {
          success: false,
          error: result.message || 'Erro desconhecido'
        };
      }

      return {
        success: true,
        messageId: result.key?.id || result.messageId
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia uma mensagem de mídia usando a API Evolution v2
   */
  sendMediaMessage = async (
    phoneNumber: string, 
    media: string, 
    caption: string = '', 
    mediaType: 'image' | 'audio' | 'video' | 'document',
    mimetype: string = '', // agora explicitamente recebido ou derivado pelo chamador
    fileName: string = ''  // agora explicitamente recebido ou derivado pelo chamador
  ): Promise<SendMessageResult> => {
    try {
      console.log('🎥 [EVOLUTION_API] Enviando mensagem de mídia:', {
        instanceName: this.config.instanceName,
        phoneNumber,
        mediaType,
        captionLength: caption.length,
        mimetype,
        fileName
      });

      const url = `${this.config.baseUrl}/message/sendMedia/${this.config.instanceName}`;
      
      // Payload EXATO conforme documentação da Evolution API v2
      const payload = {
        number: phoneNumber,
        mediatype: mediaType,
        mimetype,
        caption,
        media,
        fileName
        // Campos extras opcionais (delay, linkPreview etc) podem ser adicionados se necessário
      };

      console.log('🎥 [EVOLUTION_API] URL:', url);
      console.log('🎥 [EVOLUTION_API] Payload:', JSON.stringify(payload));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      console.log('🎥 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🎥 [EVOLUTION_API] Resultado:', result);

      // Verificar se a resposta está no formato esperado
      if (Array.isArray(result) && result.length > 0 && result[0].success) {
        return {
          success: true,
          messageId: result[0].data?.key?.id
        };
      }

      // Formato alternativo de resposta
      if (result.success) {
        return {
          success: true,
          messageId: result.data?.key?.id || result.key?.id
        };
      }

      if (result.status === 'error') {
        return {
          success: false,
          error: result.message || 'Erro desconhecido'
        };
      }

      return {
        success: true,
        messageId: result.key?.id || result.messageId
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao enviar mídia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

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
  }

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


