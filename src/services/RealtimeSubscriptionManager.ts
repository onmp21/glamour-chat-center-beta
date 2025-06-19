
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  subscribers: Map<string, (payload: any) => void>;
  isSubscribed: boolean;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private subscriberCounter = 0;

  public static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  public async subscribe(
    tableName: string,
    callback: (payload: any) => void
  ): Promise<string> {
    const subscriberId = `${tableName}_${++this.subscriberCounter}_${Date.now()}`;
    
    console.log(`[REALTIME_MANAGER] Subscribing to ${tableName} with ID: ${subscriberId}`);

    let subscriptionInfo = this.subscriptions.get(tableName);
    
    if (!subscriptionInfo) {
      // Criar nova subscription
      const channelName = `realtime_${tableName}_${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      subscriptionInfo = {
        channel,
        subscribers: new Map(),
        isSubscribed: false
      };
      
      this.subscriptions.set(tableName, subscriptionInfo);
      
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
          // Executar todos os callbacks registrados
          subscriptionInfo?.subscribers.forEach(callback => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`[REALTIME_MANAGER] Error in callback:`, error);
            }
          });
        }
      );

      // Fazer subscribe apenas uma vez
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status for ${tableName}: ${status}`);
        if (status === 'SUBSCRIBED' && subscriptionInfo) {
          subscriptionInfo.isSubscribed = true;
        }
      });
    }

    // Adicionar callback à lista de subscribers
    subscriptionInfo.subscribers.set(subscriberId, callback);
    console.log(`[REALTIME_MANAGER] Total subscribers for ${tableName}: ${subscriptionInfo.subscribers.size}`);

    return subscriberId;
  }

  public unsubscribe(tableName: string, subscriberId: string): void {
    console.log(`[REALTIME_MANAGER] Unsubscribing ${subscriberId} from ${tableName}`);
    
    const subscriptionInfo = this.subscriptions.get(tableName);
    if (!subscriptionInfo) return;

    // Remover callback
    subscriptionInfo.subscribers.delete(subscriberId);
    console.log(`[REALTIME_MANAGER] Remaining subscribers for ${tableName}: ${subscriptionInfo.subscribers.size}`);

    // Se não há mais subscribers, limpar subscription
    if (subscriptionInfo.subscribers.size === 0) {
      console.log(`[REALTIME_MANAGER] No more subscribers, cleaning up ${tableName}`);
      
      try {
        supabase.removeChannel(subscriptionInfo.channel);
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error removing channel:`, error);
      }
      
      this.subscriptions.delete(tableName);
    }
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const info = this.subscriptions.get(key);
      return info?.isSubscribed || false;
    });
  }

  public cleanup(): void {
    console.log(`[REALTIME_MANAGER] Cleaning up all subscriptions`);
    
    for (const [tableName, info] of this.subscriptions.entries()) {
      try {
        supabase.removeChannel(info.channel);
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup for ${tableName}:`, error);
      }
    }
    
    this.subscriptions.clear();
  }
}

export default RealtimeSubscriptionManager;
