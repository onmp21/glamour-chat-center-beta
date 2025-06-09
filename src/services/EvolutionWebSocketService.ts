export interface WebSocketConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface WebSocketMessage {
  event: string;
  instance: string;
  data: any;
}

export class EvolutionWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

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

      // Primeiro configurar o WebSocket na API Evolution
      await this.configureWebSocket();

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

        this.ws.onopen = () => {
          console.log(`✅ [WEBSOCKET] Conectado à instância: ${normalizedName}`);
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log(`📨 [WEBSOCKET] Mensagem recebida:`, message);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ [WEBSOCKET] Erro ao processar mensagem:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 [WEBSOCKET] Conexão fechada:`, event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('❌ [WEBSOCKET] Erro de conexão:', error);
          reject(error);
        };

        // Timeout para conexão
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Timeout na conexão WebSocket'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao conectar:', error);
      return false;
    }
  }

  private async configureWebSocket(): Promise<void> {
    try {
      const normalizedName = this.normalizeInstanceName(this.config.instanceName);
      console.log(`⚙️ [WEBSOCKET] Configurando WebSocket para: ${normalizedName}`);

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
        console.error(`❌ [WEBSOCKET] Erro ao configurar: ${response.status} - ${errorText}`);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ [WEBSOCKET] Configuração aplicada:`, result);
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao configurar WebSocket:', error);
      throw error;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const { event, data } = message;

    switch (event) {
      case 'MESSAGES_UPSERT':
        this.handleMessageUpsert(data);
        break;
      case 'CONNECTION_UPDATE':
        this.handleConnectionUpdate(data);
        break;
      case 'MESSAGES_UPDATE':
        this.handleMessageUpdate(data);
        break;
      case 'MESSAGES_DELETE':
        this.handleMessageDelete(data);
        break;
      default:
        console.log(`📨 [WEBSOCKET] Evento não tratado: ${event}`, data);
    }

    // Chamar handlers personalizados
    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  private handleMessageUpsert(data: any): void {
    console.log(`📨 [WEBSOCKET] Nova mensagem:`, data);
    
    if (data.messages && Array.isArray(data.messages)) {
      data.messages.forEach((message: any) => {
        // Processar mensagem recebida
        this.processIncomingMessage(message);
      });
    }
  }

  private handleConnectionUpdate(data: any): void {
    console.log(`🔌 [WEBSOCKET] Atualização de conexão:`, data);
    
    // Emitir evento para componentes React
    window.dispatchEvent(new CustomEvent('evolution-connection-update', {
      detail: data
    }));
  }

  private handleMessageUpdate(data: any): void {
    console.log(`📝 [WEBSOCKET] Mensagem atualizada:`, data);
    
    // Emitir evento para componentes React
    window.dispatchEvent(new CustomEvent('evolution-message-update', {
      detail: data
    }));
  }

  private handleMessageDelete(data: any): void {
    console.log(`🗑️ [WEBSOCKET] Mensagem deletada:`, data);
    
    // Emitir evento para componentes React
    window.dispatchEvent(new CustomEvent('evolution-message-delete', {
      detail: data
    }));
  }

  private processIncomingMessage(message: any): void {
    try {
      console.log(`📨 [WEBSOCKET] Processando mensagem:`, message);

      // Extrair informações da mensagem
      const messageData = {
        id: message.key?.id,
        remoteJid: message.key?.remoteJid,
        fromMe: message.key?.fromMe,
        messageType: this.getMessageType(message),
        content: this.extractMessageContent(message),
        timestamp: message.messageTimestamp,
        pushName: message.pushName,
        participant: message.participant
      };

      console.log(`📨 [WEBSOCKET] Dados extraídos:`, messageData);

      // Emitir evento para componentes React
      window.dispatchEvent(new CustomEvent('evolution-message-received', {
        detail: messageData
      }));

      // Salvar mensagem no Supabase se necessário
      this.saveMessageToDatabase(messageData);

    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao processar mensagem:', error);
    }
  }

  private getMessageType(message: any): string {
    if (message.message?.conversation) return 'text';
    if (message.message?.extendedTextMessage) return 'text';
    if (message.message?.imageMessage) return 'image';
    if (message.message?.audioMessage) return 'audio';
    if (message.message?.videoMessage) return 'video';
    if (message.message?.documentMessage) return 'document';
    if (message.message?.stickerMessage) return 'sticker';
    if (message.message?.locationMessage) return 'location';
    if (message.message?.contactMessage) return 'contact';
    return 'unknown';
  }

  private extractMessageContent(message: any): any {
    const msg = message.message;
    
    if (msg?.conversation) {
      return { text: msg.conversation };
    }
    
    if (msg?.extendedTextMessage) {
      return { text: msg.extendedTextMessage.text };
    }
    
    if (msg?.imageMessage) {
      return {
        caption: msg.imageMessage.caption,
        mimetype: msg.imageMessage.mimetype,
        url: msg.imageMessage.url,
        base64: msg.imageMessage.base64 // Se disponível
      };
    }
    
    if (msg?.audioMessage) {
      return {
        mimetype: msg.audioMessage.mimetype,
        url: msg.audioMessage.url,
        base64: msg.audioMessage.base64, // Se disponível
        ptt: msg.audioMessage.ptt // Push to talk
      };
    }
    
    if (msg?.videoMessage) {
      return {
        caption: msg.videoMessage.caption,
        mimetype: msg.videoMessage.mimetype,
        url: msg.videoMessage.url,
        base64: msg.videoMessage.base64 // Se disponível
      };
    }
    
    if (msg?.documentMessage) {
      return {
        fileName: msg.documentMessage.fileName,
        mimetype: msg.documentMessage.mimetype,
        url: msg.documentMessage.url,
        base64: msg.documentMessage.base64 // Se disponível
      };
    }
    
    if (msg?.stickerMessage) {
      return {
        mimetype: msg.stickerMessage.mimetype,
        url: msg.stickerMessage.url,
        base64: msg.stickerMessage.base64 // Se disponível
      };
    }
    
    if (msg?.locationMessage) {
      return {
        latitude: msg.locationMessage.degreesLatitude,
        longitude: msg.locationMessage.degreesLongitude,
        name: msg.locationMessage.name,
        address: msg.locationMessage.address
      };
    }
    
    if (msg?.contactMessage) {
      return {
        displayName: msg.contactMessage.displayName,
        vcard: msg.contactMessage.vcard
      };
    }
    
    return { raw: msg };
  }

  private async saveMessageToDatabase(messageData: any): Promise<void> {
    try {
      // Implementar salvamento no Supabase
      console.log(`💾 [WEBSOCKET] Salvando mensagem no banco:`, messageData);
      
      // TODO: Implementar integração com Supabase
      // const { data, error } = await supabase
      //   .from('messages')
      //   .insert([messageData]);
      
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erro ao salvar mensagem:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 [WEBSOCKET] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ [WEBSOCKET] Erro na reconexão:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ [WEBSOCKET] Máximo de tentativas de reconexão atingido');
    }
  }

  onMessage(event: string, handler: (data: any) => void): void {
    this.messageHandlers.set(event, handler);
  }

  disconnect(): void {
    if (this.ws) {
      console.log(`🔌 [WEBSOCKET] Desconectando...`);
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }
}

export class EvolutionWebSocketManager {
  private connections: Map<string, EvolutionWebSocketService> = new Map();

  addConnection(channelId: string, config: WebSocketConfig): EvolutionWebSocketService {
    const service = new EvolutionWebSocketService(config);
    this.connections.set(channelId, service);
    console.log(`✅ [WEBSOCKET_MANAGER] Conexão adicionada para canal: ${channelId}`);
    return service;
  }

  getConnection(channelId: string): EvolutionWebSocketService | null {
    return this.connections.get(channelId) || null;
  }

  removeConnection(channelId: string): void {
    const connection = this.connections.get(channelId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(channelId);
      console.log(`🗑️ [WEBSOCKET_MANAGER] Conexão removida para canal: ${channelId}`);
    }
  }

  disconnectAll(): void {
    for (const [channelId, connection] of this.connections.entries()) {
      connection.disconnect();
    }
    this.connections.clear();
    console.log(`🔌 [WEBSOCKET_MANAGER] Todas as conexões desconectadas`);
  }

  listConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  getConnectionStates(): Record<string, string> {
    const states: Record<string, string> = {};
    for (const [channelId, connection] of this.connections.entries()) {
      states[channelId] = connection.getConnectionState();
    }
    return states;
  }
}

export const evolutionWebSocketManager = new EvolutionWebSocketManager();

