
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  callbacks: Set<(payload: any) => void>;
  isSubscribed: boolean;
  subscriptionPromise: Promise<any> | null;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private pendingSubscriptions: Map<string, Promise<any>> = new Map();

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
    console.log(`[REALTIME_MANAGER] Creating subscription for table: ${tableName}`);

    // Se já existe uma subscrição pendente, aguardar ela
    if (this.pendingSubscriptions.has(tableName)) {
      console.log(`[REALTIME_MANAGER] Waiting for pending subscription: ${tableName}`);
      const existingPromise = this.pendingSubscriptions.get(tableName)!;
      await existingPromise;
    }

    // Obter ou criar subscription info
    let subscriptionInfo = this.subscriptions.get(tableName);
    
    if (!subscriptionInfo) {
      // Criar nova subscription com promise para evitar condições de corrida
      const subscriptionPromise = this.setupNewSubscription(tableName);
      this.pendingSubscriptions.set(tableName, subscriptionPromise);
      
      try {
        subscriptionInfo = await subscriptionPromise;
        this.subscriptions.set(tableName, subscriptionInfo);
        console.log(`[REALTIME_MANAGER] New subscription created for: ${tableName}`);
      } finally {
        this.pendingSubscriptions.delete(tableName);
      }
    }

    // Adicionar callback
    subscriptionInfo.callbacks.add(callback);
    console.log(`[REALTIME_MANAGER] Added callback, total for ${tableName}: ${subscriptionInfo.callbacks.size}`);

    return subscriptionInfo.channel;
  }

  private async setupNewSubscription(tableName: string): Promise<SubscriptionInfo> {
    return new Promise((resolve, reject) => {
      const channelName = `realtime-${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase.channel(channelName);
      
      const subscriptionInfo: SubscriptionInfo = {
        channel,
        callbacks: new Set(),
        isSubscribed: false,
        subscriptionPromise: null
      };

      // Configurar o listener ANTES de se inscrever
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          console.log(`[REALTIME_MANAGER] Received update for ${tableName}:`, payload);
          // Chamar todos os callbacks registrados
          subscriptionInfo.callbacks.forEach(callback => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`[REALTIME_MANAGER] Error in callback for ${tableName}:`, error);
            }
          });
        }
      );

      // Se inscrever apenas uma vez
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status for ${tableName}: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionInfo.isSubscribed = true;
          console.log(`[REALTIME_MANAGER] Successfully subscribed to: ${tableName}`);
          resolve(subscriptionInfo);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[REALTIME_MANAGER] Failed to subscribe to: ${tableName}`);
          reject(new Error(`Failed to subscribe to table: ${tableName}`));
        }
      });
    });
  }

  public removeSubscription(tableName: string, callback?: (payload: any) => void): void {
    const subscriptionInfo = this.subscriptions.get(tableName);
    if (!subscriptionInfo) {
      console.warn(`[REALTIME_MANAGER] No subscription found for table: ${tableName}`);
      return;
    }

    // Remover callback específico se fornecido
    if (callback) {
      subscriptionInfo.callbacks.delete(callback);
      console.log(`[REALTIME_MANAGER] Removed callback, remaining for ${tableName}: ${subscriptionInfo.callbacks.size}`);
    }

    // Se não há mais callbacks, remover a subscrição inteira
    if (subscriptionInfo.callbacks.size === 0) {
      console.log(`[REALTIME_MANAGER] No more callbacks, removing subscription for: ${tableName}`);
      try {
        if (subscriptionInfo.isSubscribed) {
          supabase.removeChannel(subscriptionInfo.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error removing channel for ${tableName}:`, error);
      }
      this.subscriptions.delete(tableName);
    }
  }

  public cleanup(): void {
    console.log(`[REALTIME_MANAGER] Cleaning up all subscriptions`);
    
    for (const [tableName, info] of this.subscriptions.entries()) {
      try {
        if (info.isSubscribed) {
          supabase.removeChannel(info.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup for ${tableName}:`, error);
      }
    }
    
    this.subscriptions.clear();
    this.pendingSubscriptions.clear();
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const info = this.subscriptions.get(key);
      return info?.isSubscribed || false;
    });
  }
}

export default RealtimeSubscriptionManager;
