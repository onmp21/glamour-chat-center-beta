
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  subscriptionCount: number;
  channelName: string;
  isSubscribed: boolean;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private isShuttingDown = false;
  private pendingSubscriptions: Map<string, Promise<any>> = new Map();

  public static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  public async createSubscription(
    channelName: string,
    callback: (payload: any) => void,
    tableName: string
  ): Promise<any> {
    if (this.isShuttingDown) {
      console.warn(`[REALTIME_MANAGER] Cannot create subscription during shutdown: ${channelName}`);
      return null;
    }

    // Se já existe uma subscription ativa para este canal, retorna ela
    const existing = this.subscriptions.get(channelName);
    if (existing && existing.isSubscribed) {
      console.log(`[REALTIME_MANAGER] Reusing existing active subscription: ${channelName}`);
      existing.subscriptionCount++;
      return existing.channel;
    }

    // Se há uma subscription pendente, aguarda ela
    if (this.pendingSubscriptions.has(channelName)) {
      console.log(`[REALTIME_MANAGER] Waiting for pending subscription: ${channelName}`);
      return await this.pendingSubscriptions.get(channelName);
    }

    // Cria nova subscription
    console.log(`[REALTIME_MANAGER] Creating new subscription: ${channelName} for table: ${tableName}`);
    
    const subscriptionPromise = this.createNewSubscription(channelName, callback, tableName);
    this.pendingSubscriptions.set(channelName, subscriptionPromise);
    
    try {
      const result = await subscriptionPromise;
      this.pendingSubscriptions.delete(channelName);
      return result;
    } catch (error) {
      this.pendingSubscriptions.delete(channelName);
      throw error;
    }
  }

  private async createNewSubscription(
    channelName: string, 
    callback: (payload: any) => void, 
    tableName: string
  ): Promise<any> {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        callback
      );

    // Armazenar informações antes do subscribe
    this.subscriptions.set(channelName, {
      channel,
      subscriptionCount: 1,
      channelName,
      isSubscribed: false
    });

    // Fazer subscribe apenas uma vez
    return new Promise((resolve, reject) => {
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status: ${status} for ${channelName}`);
        
        const info = this.subscriptions.get(channelName);
        if (info) {
          if (status === 'SUBSCRIBED') {
            info.isSubscribed = true;
            resolve(channel);
          } else if (status === 'CHANNEL_ERROR') {
            this.subscriptions.delete(channelName);
            reject(new Error(`Failed to subscribe to channel: ${channelName}`));
          }
        }
      });
    });
  }

  public removeSubscription(channelName: string): void {
    const existing = this.subscriptions.get(channelName);
    if (!existing) {
      console.warn(`[REALTIME_MANAGER] Subscription not found: ${channelName}`);
      return;
    }

    existing.subscriptionCount--;
    console.log(`[REALTIME_MANAGER] Decremented subscription count for ${channelName}: ${existing.subscriptionCount}`);

    if (existing.subscriptionCount <= 0) {
      console.log(`[REALTIME_MANAGER] Removing subscription: ${channelName}`);
      try {
        if (existing.isSubscribed) {
          supabase.removeChannel(existing.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error removing channel: ${channelName}`, error);
      }
      this.subscriptions.delete(channelName);
    }
  }

  public cleanup(): void {
    console.log(`[REALTIME_MANAGER] Cleaning up all subscriptions`);
    this.isShuttingDown = true;
    
    for (const [channelName, info] of this.subscriptions.entries()) {
      try {
        if (info.isSubscribed) {
          supabase.removeChannel(info.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup: ${channelName}`, error);
      }
    }
    
    this.subscriptions.clear();
    this.pendingSubscriptions.clear();
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
