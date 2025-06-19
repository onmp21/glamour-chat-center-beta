
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionEntry {
  channel: any;
  callbacks: Map<string, (payload: any) => void>;
  isSubscribing: boolean;
  isSubscribed: boolean;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionEntry> = new Map();
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
    console.log(`[REALTIME_MANAGER] Creating subscription for table: ${tableName}`);

    // Gerar ID único para este callback
    const callbackId = `callback_${++this.callbackCounter}_${Date.now()}`;
    
    let entry = this.subscriptions.get(tableName);
    
    if (!entry) {
      // Criar nova entrada
      entry = {
        channel: null,
        callbacks: new Map(),
        isSubscribing: false,
        isSubscribed: false
      };
      this.subscriptions.set(tableName, entry);
    }

    // Adicionar callback imediatamente
    entry.callbacks.set(callbackId, callback);
    console.log(`[REALTIME_MANAGER] Added callback ${callbackId}, total for ${tableName}: ${entry.callbacks.size}`);

    // Se já está subscrito, retornar imediatamente
    if (entry.isSubscribed && entry.channel) {
      console.log(`[REALTIME_MANAGER] Using existing subscription for: ${tableName}`);
      return callbackId;
    }

    // Se está no processo de subscrição, aguardar
    if (entry.isSubscribing) {
      console.log(`[REALTIME_MANAGER] Waiting for subscription to complete for: ${tableName}`);
      return this.waitForSubscription(tableName, callbackId);
    }

    // Iniciar processo de subscrição
    entry.isSubscribing = true;
    
    try {
      await this.setupSubscription(tableName, entry);
      entry.isSubscribed = true;
      console.log(`[REALTIME_MANAGER] Successfully subscribed to: ${tableName}`);
    } catch (error) {
      console.error(`[REALTIME_MANAGER] Failed to subscribe to ${tableName}:`, error);
      // Remover callback em caso de erro
      entry.callbacks.delete(callbackId);
      throw error;
    } finally {
      entry.isSubscribing = false;
    }

    return callbackId;
  }

  private async waitForSubscription(tableName: string, callbackId: string): Promise<string> {
    const maxWait = 5000; // 5 segundos
    const checkInterval = 100;
    let waited = 0;

    while (waited < maxWait) {
      const entry = this.subscriptions.get(tableName);
      if (entry && entry.isSubscribed && !entry.isSubscribing) {
        return callbackId;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    throw new Error(`Timeout waiting for subscription to ${tableName}`);
  }

  private async setupSubscription(tableName: string, entry: SubscriptionEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      // Criar canal único
      const channelName = `realtime-${tableName}-${Date.now()}`;
      console.log(`[REALTIME_MANAGER] Creating unique channel: ${channelName}`);
      
      const channel = supabase.channel(channelName);
      entry.channel = channel;

      // Configurar listener antes do subscribe
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          console.log(`[REALTIME_MANAGER] Received update for ${tableName}:`, payload);
          
          // Executar todos os callbacks registrados
          entry.callbacks.forEach((callback, callbackId) => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`[REALTIME_MANAGER] Error in callback ${callbackId} for ${tableName}:`, error);
            }
          });
        }
      );

      // Fazer subscribe uma única vez
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status for ${tableName}: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          reject(new Error(`Failed to subscribe to table: ${tableName}`));
        }
      });
    });
  }

  public removeSubscription(tableName: string, callbackId: string): void {
    const entry = this.subscriptions.get(tableName);
    if (!entry) {
      console.warn(`[REALTIME_MANAGER] No subscription found for table: ${tableName}`);
      return;
    }

    // Remover callback específico
    if (entry.callbacks.has(callbackId)) {
      entry.callbacks.delete(callbackId);
      console.log(`[REALTIME_MANAGER] Removed callback ${callbackId}, remaining for ${tableName}: ${entry.callbacks.size}`);
    }

    // Se não há mais callbacks, limpar tudo
    if (entry.callbacks.size === 0) {
      console.log(`[REALTIME_MANAGER] No more callbacks, cleaning up subscription for: ${tableName}`);
      
      if (entry.channel && entry.isSubscribed) {
        try {
          supabase.removeChannel(entry.channel);
        } catch (error) {
          console.warn(`[REALTIME_MANAGER] Error removing channel for ${tableName}:`, error);
        }
      }
      
      this.subscriptions.delete(tableName);
    }
  }

  public cleanup(): void {
    console.log(`[REALTIME_MANAGER] Cleaning up all subscriptions`);
    
    for (const [tableName, entry] of this.subscriptions.entries()) {
      if (entry.channel && entry.isSubscribed) {
        try {
          supabase.removeChannel(entry.channel);
        } catch (error) {
          console.warn(`[REALTIME_MANAGER] Error during cleanup for ${tableName}:`, error);
        }
      }
    }
    
    this.subscriptions.clear();
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const entry = this.subscriptions.get(key);
      return entry?.isSubscribed || false;
    });
  }
}

export default RealtimeSubscriptionManager;
