
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  callbacks: Set<(payload: any) => void>;
  isActive: boolean;
  isSubscribing: boolean;
  subscriptionPromise: Promise<any> | null;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private isShuttingDown = false;
  private subscriptionLocks: Map<string, boolean> = new Map();

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

    console.log(`[REALTIME_MANAGER] Request to subscribe to table: ${tableName}`);

    // Verificar se já existe lock para esta tabela
    if (this.subscriptionLocks.get(tableName)) {
      console.log(`[REALTIME_MANAGER] Subscription locked for ${tableName}, waiting...`);
      // Aguardar até que o lock seja liberado
      while (this.subscriptionLocks.get(tableName)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Obter ou criar subscription info
    let subscriptionInfo = this.subscriptions.get(tableName);
    
    if (!subscriptionInfo) {
      // Adquirir lock
      this.subscriptionLocks.set(tableName, true);
      
      try {
        // Verificar novamente se foi criado enquanto aguardávamos
        subscriptionInfo = this.subscriptions.get(tableName);
        if (!subscriptionInfo) {
          // Criar nova subscription info
          const channelName = `realtime-${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const channel = supabase.channel(channelName);
          
          subscriptionInfo = {
            channel,
            callbacks: new Set(),
            isActive: false,
            isSubscribing: false,
            subscriptionPromise: null
          };
          
          this.subscriptions.set(tableName, subscriptionInfo);
          console.log(`[REALTIME_MANAGER] Created new subscription info for: ${tableName}`);
        }
      } finally {
        // Liberar lock
        this.subscriptionLocks.delete(tableName);
      }
    }

    // Adicionar callback ao conjunto
    subscriptionInfo.callbacks.add(callback);
    console.log(`[REALTIME_MANAGER] Added callback, total callbacks for ${tableName}: ${subscriptionInfo.callbacks.size}`);

    // Se já está ativo, retornar o canal existente
    if (subscriptionInfo.isActive) {
      console.log(`[REALTIME_MANAGER] Reusing active subscription for: ${tableName}`);
      return subscriptionInfo.channel;
    }

    // Se já está tentando se inscrever, aguardar a promise existente
    if (subscriptionInfo.isSubscribing && subscriptionInfo.subscriptionPromise) {
      console.log(`[REALTIME_MANAGER] Waiting for pending subscription: ${tableName}`);
      return subscriptionInfo.subscriptionPromise;
    }

    // Criar nova subscrição
    console.log(`[REALTIME_MANAGER] Setting up new subscription for: ${tableName}`);
    
    subscriptionInfo.isSubscribing = true;
    subscriptionInfo.subscriptionPromise = this.setupSubscription(tableName, subscriptionInfo);
    
    return subscriptionInfo.subscriptionPromise;
  }

  private async setupSubscription(tableName: string, subscriptionInfo: SubscriptionInfo): Promise<any> {
    return new Promise((resolve, reject) => {
      const { channel } = subscriptionInfo;

      // Configurar o canal apenas uma vez
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

      // Inscrever-se apenas uma vez com handler de status
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status for ${tableName}: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionInfo.isActive = true;
          subscriptionInfo.isSubscribing = false;
          subscriptionInfo.subscriptionPromise = null;
          console.log(`[REALTIME_MANAGER] Successfully subscribed to: ${tableName}`);
          resolve(channel);
        } else if (status === 'CHANNEL_ERROR') {
          subscriptionInfo.isSubscribing = false;
          subscriptionInfo.subscriptionPromise = null;
          console.error(`[REALTIME_MANAGER] Failed to subscribe to: ${tableName}`);
          this.subscriptions.delete(tableName);
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
        if (subscriptionInfo.isActive) {
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
    this.isShuttingDown = true;
    
    for (const [tableName, info] of this.subscriptions.entries()) {
      try {
        if (info.isActive) {
          supabase.removeChannel(info.channel);
        }
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup for ${tableName}:`, error);
      }
    }
    
    this.subscriptions.clear();
    this.subscriptionLocks.clear();
    this.isShuttingDown = false;
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const info = this.subscriptions.get(key);
      return info?.isActive || false;
    });
  }

  public getSubscriptionStatus(tableName: string): string {
    const info = this.subscriptions.get(tableName);
    if (!info) return 'NOT_FOUND';
    if (info.isSubscribing) return 'SUBSCRIBING';
    if (info.isActive) return 'ACTIVE';
    return 'INACTIVE';
  }
}

export default RealtimeSubscriptionManager;
