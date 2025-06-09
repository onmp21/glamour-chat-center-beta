
import { EvolutionWebSocketService, WebSocketConfig } from './EvolutionWebSocketService';
import { ChannelInstanceMappingService } from './ChannelInstanceMappingService';

export interface ChannelWebSocketConnection {
  channelId: string;
  instanceName: string;
  webSocketService: EvolutionWebSocketService;
  isConnected: boolean;
}

export class ChannelWebSocketService {
  private connections: Map<string, ChannelWebSocketConnection> = new Map();
  private channelMappingService = new ChannelInstanceMappingService();

  async initializeChannelWebSockets(): Promise<void> {
    try {
      console.log('🚀 [CHANNEL_WS_SERVICE] Inicializando WebSockets para todos os canais');
      
      const mappings = await this.channelMappingService.getAllMappings();
      
      for (const mapping of mappings) {
        if (mapping.is_active) {
          await this.connectChannelWebSocket(mapping.channel_id, {
            baseUrl: mapping.base_url,
            apiKey: mapping.api_key,
            instanceName: mapping.instance_name
          });
        }
      }
      
      console.log(`✅ [CHANNEL_WS_SERVICE] ${mappings.length} WebSockets inicializados`);
    } catch (error) {
      console.error('❌ [CHANNEL_WS_SERVICE] Erro ao inicializar WebSockets:', error);
    }
  }

  async connectChannelWebSocket(channelId: string, config: WebSocketConfig): Promise<boolean> {
    try {
      console.log(`🔗 [CHANNEL_WS_SERVICE] Conectando WebSocket para canal: ${channelId}`);
      
      // Verificar se já existe conexão
      const existingConnection = this.connections.get(channelId);
      if (existingConnection?.isConnected) {
        console.log(`⚠️ [CHANNEL_WS_SERVICE] Canal ${channelId} já conectado`);
        return true;
      }

      const wsService = new EvolutionWebSocketService(config);
      const connected = await wsService.connect();
      
      if (connected) {
        this.connections.set(channelId, {
          channelId,
          instanceName: config.instanceName,
          webSocketService: wsService,
          isConnected: true
        });
        
        console.log(`✅ [CHANNEL_WS_SERVICE] WebSocket conectado para canal: ${channelId}`);
        return true;
      } else {
        console.error(`❌ [CHANNEL_WS_SERVICE] Falha ao conectar WebSocket para canal: ${channelId}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [CHANNEL_WS_SERVICE] Erro ao conectar WebSocket para canal ${channelId}:`, error);
      return false;
    }
  }

  async disconnectChannelWebSocket(channelId: string): Promise<void> {
    try {
      const connection = this.connections.get(channelId);
      if (connection) {
        connection.webSocketService.disconnect();
        connection.isConnected = false;
        this.connections.delete(channelId);
        console.log(`✅ [CHANNEL_WS_SERVICE] WebSocket desconectado para canal: ${channelId}`);
      }
    } catch (error) {
      console.error(`❌ [CHANNEL_WS_SERVICE] Erro ao desconectar WebSocket para canal ${channelId}:`, error);
    }
  }

  isChannelConnected(channelId: string): boolean {
    const connection = this.connections.get(channelId);
    return connection?.isConnected ?? false;
  }

  getChannelConnection(channelId: string): ChannelWebSocketConnection | undefined {
    return this.connections.get(channelId);
  }

  getAllConnections(): ChannelWebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  async reconnectAllChannels(): Promise<void> {
    console.log('🔄 [CHANNEL_WS_SERVICE] Reconectando todos os canais');
    
    const mappings = await this.channelMappingService.getAllMappings();
    
    for (const mapping of mappings) {
      if (mapping.is_active) {
        await this.disconnectChannelWebSocket(mapping.channel_id);
        await this.connectChannelWebSocket(mapping.channel_id, {
          baseUrl: mapping.base_url,
          apiKey: mapping.api_key,
          instanceName: mapping.instance_name
        });
      }
    }
  }
}

// Instância singleton
export const channelWebSocketService = new ChannelWebSocketService();
