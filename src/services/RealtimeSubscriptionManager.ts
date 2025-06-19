
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  subscriptionCount: number;
  tableName: string;
  isSubscribed: boolean;
  callbacks: Set<(payload: any) => void>;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private isShuttingDown = false;

  public static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  public async createSubscription(
    tableName: string,
    callback: (payload: any) => void
  ): Promise<any> {
    if (this.isShuttingDown) {
      console.warn(`[REALTIME_MANAGER] Cannot create subscription during shutdown: ${tableName}`);
      return null;
    }

    // Use table name as the key to prevent duplicates
    const existing = this.subscriptions.get(tableName);
    
    if (existing && existing.isSubscribed) {
      console.log(`[REALTIME_MANAGER] Reusing existing subscription for table: ${tableName}`);
      existing.subscriptionCount++;
      existing.callbacks.add(callback);
      return existing.channel;
    }

    if (existing && !existing.isSubscribed) {
      console.log(`[REALTIME_MANAGER] Adding callback to pending subscription: ${tableName}`);
      existing.callbacks.add(callback);
      existing.subscriptionCount++;
      return existing.channel;
    }

    // Create new subscription
    console.log(`[REALTIME_MANAGER] Creating new subscription for table: ${tableName}`);
    
    const channelName = `realtime-${tableName}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          const info = this.subscriptions.get(tableName);
          if (info) {
            // Call all registered callbacks
            info.callbacks.forEach(cb => {
              try {
                cb(payload);
              } catch (error) {
                console.error(`[REALTIME_MANAGER] Error in callback for ${tableName}:`, error);
              }
            });
          }
        }
      );

    // Initialize subscription info
    const callbacks = new Set<(payload: any) => void>();
    callbacks.add(callback);
    
    this.subscriptions.set(tableName, {
      channel,
      subscriptionCount: 1,
      tableName,
      isSubscribed: false,
      callbacks
    });

    // Subscribe and wait for confirmation
    return new Promise((resolve, reject) => {
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status: ${status} for table: ${tableName}`);
        
        const info = this.subscriptions.get(tableName);
        if (info) {
          if (status === 'SUBSCRIBED') {
            info.isSubscribed = true;
            resolve(channel);
          } else if (status === 'CHANNEL_ERROR') {
            this.subscriptions.delete(tableName);
            reject(new Error(`Failed to subscribe to table: ${tableName}`));
          }
        }
      });
    });
  }

  public removeSubscription(tableName: string, callback?: (payload: any) => void): void {
    const existing = this.subscriptions.get(tableName);
    if (!existing) {
      console.warn(`[REALTIME_MANAGER] Subscription not found for table: ${tableName}`);
      return;
    }

    if (callback) {
      existing.callbacks.delete(callback);
    }

    existing.subscriptionCount--;
    console.log(`[REALTIME_MANAGER] Decremented subscription count for ${tableName}: ${existing.subscriptionCount}`);

    if (existing.subscriptionCount <= 0 || existing.callbacks.size === 0) {
      console.log(`[REALTIME_MANAGER] Removing subscription for table: ${tableName}`);
      try {
        if (existing.isSubscribed) {
          supabase.removeChannel(existing.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error removing channel for table: ${tableName}`, error);
      }
      this.subscriptions.delete(tableName);
    }
  }

  public cleanup(): void {
    console.log(`[REALTIME_MANAGER] Cleaning up all subscriptions`);
    this.isShuttingDown = true;
    
    for (const [tableName, info] of this.subscriptions.entries()) {
      try {
        if (info.isSubscribed) {
          supabase.removeChannel(info.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup for table: ${tableName}`, error);
      }
    }
    
    this.subscriptions.clear();
    this.isShuttingDown = false;
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const info = this.subscriptions.get(key);
      return info?.isSubscribed || false;
    });
  }
}

export default RealtimeSubscriptionManager;
