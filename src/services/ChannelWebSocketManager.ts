
import { EvolutionWebSocketService, WebSocketConfig } from './EvolutionWebSocketService';
import { supabase } from '../integrations/supabase/client';

export interface ChannelWebSocketConnection {
  channelId: string;
  instanceName: string;
  webSocketService: EvolutionWebSocketService;
  isActive: boolean;
}

export class ChannelWebSocketManager {
  private connections: Map<string, ChannelWebSocketConnection> = new Map();
  private static instance: ChannelWebSocketManager;

  private constructor() {}

  public static getInstance(): ChannelWebSocketManager {
    if (!ChannelWebSocketManager.instance) {
      ChannelWebSocketManager.instance = new ChannelWebSocketManager();
    }
    return ChannelWebSocketManager.instance;
  }

  async initializeChannelWebSocket(
    channelId: string,
    config: WebSocketConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🚀 [CHANNEL_WS_MANAGER] Inicializando WebSocket para canal: ${channelId}`);

      const existingConnection = this.connections.get(channelId);
      if (existingConnection?.isActive) {
        console.log(`⚠️ [CHANNEL_WS_MANAGER] Canal ${channelId} já possui WebSocket ativo`);
        return { success: true };
      }

      const wsService = new EvolutionWebSocketService(config);

      const connected = await wsService.connect();
      
      if (!connected) {
        return { success: false, error: 'Falha ao conectar WebSocket' };
      }

      this.connections.set(channelId, {
        channelId,
        instanceName: config.instanceName,
        webSocketService: wsService,
        isActive: true
      });

      await this.saveChannelInstanceMapping(channelId, config);

      console.log(`✅ [CHANNEL_WS_MANAGER] WebSocket inicializado para canal: ${channelId}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [CHANNEL_WS_MANAGER] Erro ao inicializar WebSocket:`, error);
      return { success: false, error: `${error}` };
    }
  }

  private async saveChannelInstanceMapping(channelId: string, config: WebSocketConfig) {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      const mappingData = {
        channel_id: channelId,
        channel_name: channelId,
        instance_id: config.instanceName,
        instance_name: config.instanceName,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from('channel_instance_mappings')
          .update(mappingData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('channel_instance_mappings')
          .insert([{
            ...mappingData,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      console.log(`✅ [CHANNEL_WS_MANAGER] Mapeamento salvo no Supabase`);
    } catch (error) {
      console.error(`❌ [CHANNEL_WS_MANAGER] Erro ao salvar mapeamento:`, error);
      throw error;
    }
  }

  async disconnectChannelWebSocket(channelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = this.connections.get(channelId);
      
      if (!connection) {
        console.log(`⚠️ [CHANNEL_WS_MANAGER] Nenhuma conexão encontrada para canal: ${channelId}`);
        return { success: true };
      }

      connection.webSocketService.disconnect();
      connection.isActive = false;

      this.connections.delete(channelId);

      await supabase
        .from('channel_instance_mappings')
        .update({ is_active: false })
        .eq('channel_id', channelId);

      console.log(`✅ [CHANNEL_WS_MANAGER] WebSocket desconectado para canal: ${channelId}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [CHANNEL_WS_MANAGER] Erro ao desconectar WebSocket:`, error);
      return { success: false, error: `${error}` };
    }
  }

  getChannelConnection(channelId: string): ChannelWebSocketConnection | undefined {
    return this.connections.get(channelId);
  }

  getAllConnections(): ChannelWebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  async loadExistingMappings(): Promise<void> {
    try {
      console.log(`📋 [CHANNEL_WS_MANAGER] Carregando mapeamentos existentes`);

      const { data: mappings, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error(`❌ [CHANNEL_WS_MANAGER] Erro ao carregar mapeamentos:`, error);
        return;
      }

      if (!mappings?.length) {
        console.log(`ℹ️ [CHANNEL_WS_MANAGER] Nenhum mapeamento ativo encontrado`);
        return;
      }

      for (const mapping of mappings) {
        const config: WebSocketConfig = {
          baseUrl: mapping.base_url,
          apiKey: mapping.api_key,
          instanceName: mapping.instance_name
        };

        try {
          await this.initializeChannelWebSocket(mapping.channel_id, config);
          console.log(`✅ [CHANNEL_WS_MANAGER] WebSocket restaurado para canal: ${mapping.channel_id}`);
        } catch (error) {
          console.error(`❌ [CHANNEL_WS_MANAGER] Erro ao restaurar WebSocket para ${mapping.channel_id}:`, error);
        }
      }

      console.log(`✅ [CHANNEL_WS_MANAGER] ${mappings.length} mapeamento(s) processado(s)`);
    } catch (error) {
      console.error(`❌ [CHANNEL_WS_MANAGER] Erro ao carregar mapeamentos:`, error);
    }
  }

  isChannelConnected(channelId: string): boolean {
    const connection = this.connections.get(channelId);
    return connection?.isActive ?? false;
  }

  getConnectionStatus(channelId: string): string {
    const connection = this.connections.get(channelId);
    if (!connection) {
      return 'disconnected';
    }
    return connection.isActive ? 'connected' : 'disconnected';
  }
}

export const channelWebSocketManager = ChannelWebSocketManager.getInstance();
