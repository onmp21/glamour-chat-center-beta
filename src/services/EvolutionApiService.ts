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

  constructor(config: EvolutionApiConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    };
  }

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

      return Array.isArray(result) ? result : [];

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return [];
    }
  }

  /**
   * Valida a conexão com a API Evolution
   */
  validateApi = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔍 [EVOLUTION_API] Validando conexão com a API...');

      const url = `${this.config.baseUrl}/instance/fetchInstances`;
      console.log('🔍 [EVOLUTION_API] URL de validação:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      console.log('🔍 [EVOLUTION_API] Status da resposta de validação:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro na validação:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('✅ [EVOLUTION_API] API validada com sucesso:', result);

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao validar API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Lista todas as instâncias com informações detalhadas
   */
  listInstances = async (): Promise<{ success: boolean; instances?: InstanceInfo[]; error?: string }> => {
    try {
      console.log('📋 [EVOLUTION_API] Listando instâncias detalhadas...');

      const url = `${this.config.baseUrl}/instance/fetchInstances`;
      console.log('📋 [EVOLUTION_API] URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      console.log('📋 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('📋 [EVOLUTION_API] Resultado bruto:', result);

      // Processar o resultado para extrair informações das instâncias
      let instances: InstanceInfo[] = [];

      if (Array.isArray(result)) {
        instances = result.map(instance => {
          // Debug: verificar estrutura dos dados
          console.log('🔍 [DEBUG] Estrutura da instância:', JSON.stringify(instance, null, 2));
          
          // Verificar múltiplos campos para determinar o status real
          const state = instance.instance?.state || instance.state || 'close';
          const connectionStatus = instance.instance?.connectionStatus || instance.connectionStatus || 'close';
          
          // Priorizar connectionStatus se disponível, senão usar state
          const finalStatus = connectionStatus !== 'close' ? connectionStatus : state;
          
          // Obter o nome da instância - verificar múltiplos campos possíveis
          const instanceName = instance.instance?.instanceName || 
                              instance.instanceName || 
                              instance.name ||
                              instance.instance?.name ||
                              instance.instanceId ||
                              instance.instance?.instanceId;
          
          console.log('🔍 [DEBUG] Nome extraído:', instanceName);
          
          return {
            instanceName: instanceName || 'unknown',
            status: finalStatus,
            serverUrl: instance.instance?.serverUrl || instance.serverUrl || this.config.baseUrl,
            apikey: instance.instance?.apikey || instance.apikey || this.config.apiKey,
            owner: instance.instance?.owner || instance.owner || 'unknown',
            profileName: instance.instance?.profileName || instance.profileName || '',
            profilePictureUrl: instance.instance?.profilePictureUrl || instance.profilePictureUrl || '',
            integration: instance.instance?.integration || instance.integration || 'WHATSAPP-BAILEYS',
            number: instance.instance?.number || instance.number || '',
            connectionStatus: finalStatus
          };
        }).filter(instance => {
          // Filtrar apenas instâncias que realmente não têm nome válido
          console.log('🔍 [DEBUG] Verificando instância:', instance.instanceName);
          const hasValidName = instance.instanceName && 
                              instance.instanceName.trim() !== '' && 
                              instance.instanceName !== 'unknown' &&
                              instance.instanceName.length > 2; // Nome deve ter pelo menos 3 caracteres
          console.log('🔍 [DEBUG] Nome válido?', hasValidName, 'para:', instance.instanceName);
          return hasValidName;
        });
      } else if (result.instance) {
        // Caso seja uma única instância
        const state = result.instance.state || 'close';
        const connectionStatus = result.instance.connectionStatus || 'close';
        const finalStatus = connectionStatus !== 'close' ? connectionStatus : state;
        
        instances = [{
          instanceName: result.instance.instanceName || 'unknown',
          status: finalStatus,
          serverUrl: result.instance.serverUrl || this.config.baseUrl,
          apikey: result.instance.apikey || this.config.apiKey,
          owner: result.instance.owner || 'unknown',
          profileName: result.instance.profileName || '',
          profilePictureUrl: result.instance.profilePictureUrl || '',
          integration: result.instance.integration || 'WHATSAPP-BAILEYS',
          number: result.instance.number || '',
          connectionStatus: finalStatus
        }];
      }

      console.log('📋 [EVOLUTION_API] Instâncias processadas:', instances);

      return {
        success: true,
        instances
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Configura webhook para uma instância
   */
  setWebhook = async (webhookUrl: string, events: string[], instanceName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('🔗 [EVOLUTION_API] Configurando webhook para instância:', instance);
      console.log('🔗 [EVOLUTION_API] URL do webhook:', webhookUrl);
      console.log('🔗 [EVOLUTION_API] Eventos:', events);

      const url = `${this.config.baseUrl}/webhook/set/${instance}`;
      console.log('🔗 [EVOLUTION_API] URL da API:', url);

      const payload = {
        webhook: {
          url: webhookUrl,
          enabled: true,
          events: events,
          webhook_by_events: false
        }
      };

      console.log('🔗 [EVOLUTION_API] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      console.log('🔗 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🔗 [EVOLUTION_API] Resultado:', result);

      return {
        success: true
      };

    } catch (error: any) {
      console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obtém configuração do webhook de uma instância
   */
  getWebhook = async (instanceName?: string): Promise<{ success: boolean; webhook?: any; error?: string }> => {
    try {
      const instance = instanceName || this.config.instanceName;
      console.log('📋 [EVOLUTION_API] Obtendo webhook da instância:', instance);

      const url = `${this.config.baseUrl}/webhook/find/${instance}`;
      console.log('📋 [EVOLUTION_API] URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      console.log('📋 [EVOLUTION_API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [EVOLUTION_API] Erro ao obter webhook:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('📋 [EVOLUTION_API] Resultado:', result);

      return {
        success: true,
        webhook: result
      };

    } catch (error: any) {
      console.error('❌ [EVOLUTION_API] Erro ao obter webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}
