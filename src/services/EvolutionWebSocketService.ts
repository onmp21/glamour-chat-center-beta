
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

export class EvolutionWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  private normalizeInstanceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  async connect(): Promise<boolean> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`🔌 [WEBSOCKET] Conectando à instância: ${normalizedName}`);

      // Construir URL do WebSocket
      const wsUrl = this.config.baseUrl
        .replace('http://', 'ws://')
        .replace('https://', 'wss://') + 
        `/websocket/${normalizedName}?apikey=${this.config.apiKey}`;

      console.log(`🔌 [WEBSOCKET] URL: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket não inicializado'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Timeout na conexão WebSocket'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log(`✅ [WEBSOCKET] Conectado à instância: ${normalizedName}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          console.log(`🔌 [WEBSOCKET] Conexão fechada para: ${normalizedName}`);
          this.isConnected = false;
          this.handleReconnection();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`❌ [WEBSOCKET] Erro na conexão:`, error);
          this.isConnected = false;
          reject(error);
        };
      });
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao conectar:', error);
      return false;
    }
  }

  private async handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log(`📥 [WEBSOCKET] Mensagem recebida:`, message);

      // Processar apenas mensagens relevantes
      if (message.event === 'messages.upsert' && message.data) {
        await this.processIncomingMessage(message);
      }

      // Chamar handlers personalizados
      this.messageHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ [WEBSOCKET] Erro no handler:', error);
        }
      });
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao processar mensagem:', error);
    }
  }

  private async processIncomingMessage(message: WebSocketMessage) {
    try {
      const { data } = message;
      
      // Ignorar mensagens enviadas por nós
      if (data.key.fromMe) {
        console.log('📤 [WEBSOCKET] Mensagem própria ignorada');
        return;
      }

      const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
      const sessionId = phoneNumber;
      
      let messageContent = '';
      let messageType = 'text';
      let mediaBase64: string | undefined;

      // Extrair conteúdo da mensagem
      if (data.message.conversation) {
        messageContent = data.message.conversation;
      } else if (data.message.extendedTextMessage?.text) {
        messageContent = data.message.extendedTextMessage.text;
      } else if (data.message.imageMessage) {
        messageContent = data.message.imageMessage.caption || '[Imagem]';
        messageType = 'image';
        // Se houver base64 na mensagem, preservar
        if (data.message.imageMessage.base64) {
          mediaBase64 = this.processReceivedBase64(data.message.imageMessage.base64, 'image');
        }
      } else if (data.message.audioMessage) {
        messageContent = '[Áudio]';
        messageType = 'audio';
        if (data.message.audioMessage.base64) {
          mediaBase64 = this.processReceivedBase64(data.message.audioMessage.base64, 'audio');
        }
      } else if (data.message.videoMessage) {
        messageContent = data.message.videoMessage.caption || '[Vídeo]';
        messageType = 'video';
        if (data.message.videoMessage.base64) {
          mediaBase64 = this.processReceivedBase64(data.message.videoMessage.base64, 'video');
        }
      } else if (data.message.documentMessage) {
        messageContent = data.message.documentMessage.title || '[Documento]';
        messageType = 'document';
        if (data.message.documentMessage.base64) {
          mediaBase64 = this.processReceivedBase64(data.message.documentMessage.base64, 'document');
        }
      } else if (data.message.stickerMessage) {
        messageContent = '[Figurinha]';
        messageType = 'sticker';
        if (data.message.stickerMessage.base64) {
          mediaBase64 = this.processReceivedBase64(data.message.stickerMessage.base64, 'sticker');
        }
      } else {
        console.log('⚠️ [WEBSOCKET] Tipo de mensagem não suportado:', Object.keys(data.message));
        return;
      }

      // Salvar mensagem no Supabase
      await this.saveMessageToSupabase({
        sessionId,
        phoneNumber,
        content: messageContent,
        messageType,
        contactName: data.pushName || phoneNumber,
        mediaBase64,
        timestamp: new Date(data.messageTimestamp * 1000),
        instanceName: this.config.instanceName
      });

    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao processar mensagem recebida:', error);
    }
  }

  private processReceivedBase64(base64Content: string, mediaType: string): string {
    // Limpar e validar base64 recebido
    let cleanBase64 = base64Content.replace(/\s/g, '');
    
    // Se já é data URL, extrair base64
    if (cleanBase64.startsWith('data:')) {
      const parts = cleanBase64.split(',');
      cleanBase64 = parts.length > 1 ? parts[1] : cleanBase64;
    }
    
    // Validar base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      console.warn('⚠️ [WEBSOCKET] Base64 inválido recebido');
      return cleanBase64; // Retornar mesmo assim para não perder dados
    }
    
    // Adicionar padding se necessário
    const paddingNeeded = 4 - (cleanBase64.length % 4);
    if (paddingNeeded < 4) {
      cleanBase64 += '='.repeat(paddingNeeded);
    }
    
    // Determinar MIME type
    const mimeType = this.getMimeTypeForMediaType(mediaType);
    
    return `data:${mimeType};base64,${cleanBase64}`;
  }

  private getMimeTypeForMediaType(mediaType: string): string {
    switch (mediaType) {
      case 'image': return 'image/jpeg';
      case 'audio': return 'audio/mpeg';
      case 'video': return 'video/mp4';
      case 'document': return 'application/pdf';
      case 'sticker': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }

  private async saveMessageToSupabase(messageData: {
    sessionId: string;
    phoneNumber: string;
    content: string;
    messageType: string;
    contactName: string;
    mediaBase64?: string;
    timestamp: Date;
    instanceName: string;
  }) {
    try {
      const tableName = this.getTableNameForInstance(messageData.instanceName);
      
      const messageRecord: any = {
        session_id: messageData.sessionId,
        message: messageData.content,
        tipo_remetente: 'CONTATO_EXTERNO',
        mensagemtype: messageData.messageType,
        read_at: messageData.timestamp.toISOString(),
        is_read: false
      };

      // Adicionar base64 se houver
      if (messageData.mediaBase64) {
        messageRecord.media_base64 = messageData.mediaBase64;
      }

      // Adicionar campo de contato específico por instância
      const contactField = this.getContactFieldForInstance(messageData.instanceName);
      messageRecord[contactField] = messageData.contactName;

      console.log(`💾 [WEBSOCKET] Salvando mensagem na tabela: ${tableName}`);

      const { error } = await supabase
        .from(tableName as any)
        .insert([messageRecord]);

      if (error) {
        console.error('❌ [WEBSOCKET] Erro ao salvar mensagem:', error);
        throw error;
      }

      console.log('✅ [WEBSOCKET] Mensagem salva com sucesso no Supabase');
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao salvar mensagem no Supabase:', error);
      throw error;
    }
  }

  private getTableNameForInstance(instanceName: string): string {
    const instanceToTableMap: Record<string, string> = {
      'yelena-ai': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };
    
    return instanceToTableMap[instanceName] || 'yelena_ai_conversas';
  }

  private getContactFieldForInstance(instanceName: string): string {
    const instanceToContactFieldMap: Record<string, string> = {
      'yelena-ai': 'Nome_do_contato',
      'canarana': 'nome_do_contato',
      'souto-soares': 'nome_do_contato',
      'joao-dourado': 'nome_do_contato',
      'america-dourada': 'nome_do_contato',
      'gerente-lojas': 'nome_do_contato',
      'gerente-externo': 'Nome_do_contato'
    };
    
    return instanceToContactFieldMap[instanceName] || 'nome_do_contato';
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ [WEBSOCKET] Máximo de tentativas de reconexão atingido`);
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 [WEBSOCKET] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error(`❌ [WEBSOCKET] Erro na reconexão:`, error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  public addMessageHandler(id: string, handler: (data: any) => void) {
    this.messageHandlers.set(id, handler);
  }

  public removeMessageHandler(id: string) {
    this.messageHandlers.delete(id);
  }

  public disconnect() {
    if (this.ws) {
      console.log(`🔌 [WEBSOCKET] Desconectando WebSocket`);
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}
