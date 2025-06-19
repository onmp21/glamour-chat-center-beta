
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  callbacks: Set<(payload: any) => void>;
  isActive: boolean;
  subscriptionPromise: Promise<any> | null;
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

    console.log(`[REALTIME_MANAGER] Request to subscribe to table: ${tableName}`);

    // Get or create subscription info
    let subscriptionInfo = this.subscriptions.get(tableName);
    
    if (!subscriptionInfo) {
      // Create new subscription info
      const channelName = `realtime-${tableName}-${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      subscriptionInfo = {
        channel,
        callbacks: new Set(),
        isActive: false,
        subscriptionPromise: null
      };
      
      this.subscriptions.set(tableName, subscriptionInfo);
      console.log(`[REALTIME_MANAGER] Created new subscription info for: ${tableName}`);
    }

    // Add callback to the set
    subscriptionInfo.callbacks.add(callback);
    console.log(`[REALTIME_MANAGER] Added callback, total callbacks for ${tableName}: ${subscriptionInfo.callbacks.size}`);

    // If already active, return existing channel
    if (subscriptionInfo.isActive) {
      console.log(`[REALTIME_MANAGER] Reusing active subscription for: ${tableName}`);
      return subscriptionInfo.channel;
    }

    // If subscription is in progress, wait for it
    if (subscriptionInfo.subscriptionPromise) {
      console.log(`[REALTIME_MANAGER] Waiting for pending subscription: ${tableName}`);
      return subscriptionInfo.subscriptionPromise;
    }

    // Create new subscription
    console.log(`[REALTIME_MANAGER] Setting up new subscription for: ${tableName}`);
    
    subscriptionInfo.subscriptionPromise = this.setupSubscription(tableName, subscriptionInfo);
    
    return subscriptionInfo.subscriptionPromise;
  }

  private async setupSubscription(tableName: string, subscriptionInfo: SubscriptionInfo): Promise<any> {
    return new Promise((resolve, reject) => {
      const { channel } = subscriptionInfo;

      // Configure the channel
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          console.log(`[REALTIME_MANAGER] Received update for ${tableName}:`, payload);
          // Call all registered callbacks
          subscriptionInfo.callbacks.forEach(callback => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`[REALTIME_MANAGER] Error in callback for ${tableName}:`, error);
            }
          });
        }
      );

      // Subscribe with status handler
      channel.subscribe((status: string) => {
        console.log(`[REALTIME_MANAGER] Subscription status for ${tableName}: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionInfo.isActive = true;
          subscriptionInfo.subscriptionPromise = null;
          console.log(`[REALTIME_MANAGER] Successfully subscribed to: ${tableName}`);
          resolve(channel);
        } else if (status === 'CHANNEL_ERROR') {
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

    // Remove specific callback if provided
    if (callback) {
      subscriptionInfo.callbacks.delete(callback);
      console.log(`[REALTIME_MANAGER] Removed callback, remaining for ${tableName}: ${subscriptionInfo.callbacks.size}`);
    }

    // If no more callbacks, remove the entire subscription
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
    this.isShuttingDown = false;
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const info = this.subscriptions.get(key);
      return info?.isActive || false;
    });
  }
}

export default RealtimeSubscriptionManager;
