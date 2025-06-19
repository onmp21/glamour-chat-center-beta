
import { supabase } from '@/integrations/supabase/client';

interface ActiveSubscription {
  channel: any;
  callbacks: Set<string>;
  isActive: boolean;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private callbackCounter = 0;

  public static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  public async createSubscription(
    tableName: string,
    callback: (payload: any) => void
  ): Promise<string> {
    const callbackId = `${tableName}_${++this.callbackCounter}_${Date.now()}`;
    
    console.log(`[REALTIME_MANAGER] Creating subscription for table: ${tableName}, callback: ${callbackId}`);

    let subscription = this.subscriptions.get(tableName);
    
    if (subscription && subscription.isActive) {
      // Usar subscrição existente
      subscription.callbacks.add(callbackId);
      console.log(`[REALTIME_MANAGER] Using existing subscription for ${tableName}, total callbacks: ${subscription.callbacks.size}`);
      
      // Armazenar callback para execução
      this.storeCallback(callbackId, callback);
      return callbackId;
    }

    // Criar nova subscrição
    try {
      const channelName = `realtime_${tableName}_${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      subscription = {
        channel,
        callbacks: new Set([callbackId]),
        isActive: false
      };
      
      this.subscriptions.set(tableName, subscription);
      this.storeCallback(callbackId, callback);

      // Configurar listener
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          console.log(`[REALTIME_MANAGER] Message received for ${tableName}:`, payload);
          this.executeCallbacks(tableName, payload);
        }
      );

      // Fazer subscribe uma única vez
      await new Promise<void>((resolve, reject) => {
        channel.subscribe((status: string) => {
          console.log(`[REALTIME_MANAGER] Subscription status for ${tableName}: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            if (subscription) {
              subscription.isActive = true;
            }
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error(`Failed to subscribe to ${tableName}`));
          }
        });
      });

      console.log(`[REALTIME_MANAGER] Successfully subscribed to ${tableName}`);
      return callbackId;
      
    } catch (error) {
      console.error(`[REALTIME_MANAGER] Error creating subscription for ${tableName}:`, error);
      this.subscriptions.delete(tableName);
      throw error;
    }
  }

  private callbackStore: Map<string, (payload: any) => void> = new Map();

  private storeCallback(callbackId: string, callback: (payload: any) => void) {
    this.callbackStore.set(callbackId, callback);
  }

  private executeCallbacks(tableName: string, payload: any) {
    const subscription = this.subscriptions.get(tableName);
    if (!subscription) return;

    subscription.callbacks.forEach(callbackId => {
      const callback = this.callbackStore.get(callbackId);
      if (callback) {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[REALTIME_MANAGER] Error in callback ${callbackId}:`, error);
        }
      }
    });
  }

  public removeSubscription(tableName: string, callbackId: string): void {
    console.log(`[REALTIME_MANAGER] Removing callback ${callbackId} from ${tableName}`);
    
    const subscription = this.subscriptions.get(tableName);
    if (!subscription) return;

    subscription.callbacks.delete(callbackId);
    this.callbackStore.delete(callbackId);

    console.log(`[REALTIME_MANAGER] Remaining callbacks for ${tableName}: ${subscription.callbacks.size}`);

    // Se não há mais callbacks, limpar subscrição
    if (subscription.callbacks.size === 0) {
      console.log(`[REALTIME_MANAGER] No more callbacks, cleaning up subscription for ${tableName}`);
      
      try {
        if (subscription.channel && subscription.isActive) {
          supabase.removeChannel(subscription.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error removing channel for ${tableName}:`, error);
      }
      
      this.subscriptions.delete(tableName);
    }
  }

  public cleanup(): void {
    console.log(`[REALTIME_MANAGER] Cleaning up all subscriptions`);
    
    for (const [tableName, subscription] of this.subscriptions.entries()) {
      try {
        if (subscription.channel && subscription.isActive) {
          supabase.removeChannel(subscription.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup for ${tableName}:`, error);
      }
    }
    
    this.subscriptions.clear();
    this.callbackStore.clear();
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const sub = this.subscriptions.get(key);
      return sub?.isActive || false;
    });
  }
}

export default RealtimeSubscriptionManager;
