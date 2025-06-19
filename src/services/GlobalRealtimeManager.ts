
class GlobalRealtimeManager {
  private static instance: GlobalRealtimeManager;
  private activeChannels: Map<string, {
    channel: any;
    callbacks: Map<string, (payload: any) => void>;
    isSubscribed: boolean;
  }> = new Map();
  
  private subscriberCounter = 0;

  public static getInstance(): GlobalRealtimeManager {
    if (!GlobalRealtimeManager.instance) {
      GlobalRealtimeManager.instance = new GlobalRealtimeManager();
    }
    return GlobalRealtimeManager.instance;
  }

  public async subscribe(
    tableName: string,
    callback: (payload: any) => void
  ): Promise<string> {
    const subscriberId = `${tableName}_${++this.subscriberCounter}_${Date.now()}`;
    
    console.log(`[GLOBAL_REALTIME] Subscribing to ${tableName} with ID: ${subscriberId}`);

    let channelInfo = this.activeChannels.get(tableName);
    
    if (!channelInfo) {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      const channelName = `global_${tableName}_${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      channelInfo = {
        channel,
        callbacks: new Map(),
        isSubscribed: false
      };
      
      this.activeChannels.set(tableName, channelInfo);
      
      // Setup the postgres changes listener
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          console.log(`[GLOBAL_REALTIME] Message received for ${tableName}:`, payload);
          
          // Distribute to all callbacks for this table
          channelInfo?.callbacks.forEach((callback, id) => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`[GLOBAL_REALTIME] Error in callback ${id}:`, error);
            }
          });
        }
      );

      // Subscribe to the channel
      channel.subscribe((status: string) => {
        console.log(`[GLOBAL_REALTIME] Subscription status for ${tableName}: ${status}`);
        if (status === 'SUBSCRIBED' && channelInfo) {
          channelInfo.isSubscribed = true;
        }
      });
    }

    // Add this callback to the channel
    channelInfo.callbacks.set(subscriberId, callback);
    console.log(`[GLOBAL_REALTIME] Total callbacks for ${tableName}: ${channelInfo.callbacks.size}`);

    return subscriberId;
  }

  public unsubscribe(tableName: string, subscriberId: string): void {
    console.log(`[GLOBAL_REALTIME] Unsubscribing ${subscriberId} from ${tableName}`);
    
    const channelInfo = this.activeChannels.get(tableName);
    if (!channelInfo) {
      console.warn(`[GLOBAL_REALTIME] No channel found for ${tableName}`);
      return;
    }

    // Remove this specific callback
    channelInfo.callbacks.delete(subscriberId);
    console.log(`[GLOBAL_REALTIME] Remaining callbacks for ${tableName}: ${channelInfo.callbacks.size}`);

    // If no more callbacks, cleanup the channel
    if (channelInfo.callbacks.size === 0) {
      console.log(`[GLOBAL_REALTIME] No more callbacks, cleaning up ${tableName}`);
      
      this.cleanupChannel(tableName, channelInfo);
    }
  }

  private async cleanupChannel(tableName: string, channelInfo: any): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      supabase.removeChannel(channelInfo.channel);
      this.activeChannels.delete(tableName);
      console.log(`[GLOBAL_REALTIME] Channel ${tableName} cleaned up successfully`);
    } catch (error) {
      console.warn(`[GLOBAL_REALTIME] Error cleaning up channel ${tableName}:`, error);
    }
  }

  public getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys()).filter(tableName => {
      const info = this.activeChannels.get(tableName);
      return info?.isSubscribed || false;
    });
  }

  public async cleanup(): Promise<void> {
    console.log(`[GLOBAL_REALTIME] Cleaning up all channels`);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    for (const [tableName, channelInfo] of this.activeChannels.entries()) {
      try {
        supabase.removeChannel(channelInfo.channel);
        console.log(`[GLOBAL_REALTIME] Cleaned up channel: ${tableName}`);
      } catch (error) {
        console.warn(`[GLOBAL_REALTIME] Error during cleanup for ${tableName}:`, error);
      }
    }
    
    this.activeChannels.clear();
  }
}

export default GlobalRealtimeManager;
