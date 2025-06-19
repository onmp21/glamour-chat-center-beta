
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  callbacks: Set<(payload: any) => void>;
  isSubscribed: boolean;
}

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
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
    console.log(`[REALTIME_MANAGER] Creating subscription for table: ${tableName}`);

    // Check if we're already in the process of creating a subscription
    if (this.subscriptionLocks.get(tableName)) {
      console.log(`[REALTIME_MANAGER] Subscription creation in progress for: ${tableName}, waiting...`);
      // Wait for the existing subscription to be ready
      return this.waitForSubscription(tableName, callback);
    }

    // Check if subscription already exists
    let subscriptionInfo = this.subscriptions.get(tableName);
    
    if (subscriptionInfo) {
      console.log(`[REALTIME_MANAGER] Using existing subscription for: ${tableName}`);
      subscriptionInfo.callbacks.add(callback);
      console.log(`[REALTIME_MANAGER] Added callback, total for ${tableName}: ${subscriptionInfo.callbacks.size}`);
      return subscriptionInfo.channel;
    }

    // Lock to prevent concurrent subscription creation
    this.subscriptionLocks.set(tableName, true);

    try {
      // Create new subscription
      subscriptionInfo = await this.setupNewSubscription(tableName);
      this.subscriptions.set(tableName, subscriptionInfo);
      
      // Add the callback
      subscriptionInfo.callbacks.add(callback);
      console.log(`[REALTIME_MANAGER] New subscription created and callback added for: ${tableName}`);
      
      return subscriptionInfo.channel;
    } finally {
      // Always release the lock
      this.subscriptionLocks.delete(tableName);
    }
  }

  private async waitForSubscription(tableName: string, callback: (payload: any) => void): Promise<any> {
    // Wait for the subscription to be ready (max 5 seconds)
    const maxWait = 5000;
    const checkInterval = 100;
    let waited = 0;

    while (waited < maxWait) {
      const subscriptionInfo = this.subscriptions.get(tableName);
      if (subscriptionInfo && subscriptionInfo.isSubscribed) {
        subscriptionInfo.callbacks.add(callback);
        console.log(`[REALTIME_MANAGER] Added callback to existing subscription for: ${tableName}`);
        return subscriptionInfo.channel;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    throw new Error(`Timeout waiting for subscription to be ready for table: ${tableName}`);
  }

  private async setupNewSubscription(tableName: string): Promise<SubscriptionInfo> {
    return new Promise((resolve, reject) => {
      // Create a unique channel name to avoid conflicts
      const channelName = `realtime-${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[REALTIME_MANAGER] Creating channel: ${channelName}`);
      
      const channel = supabase.channel(channelName);
      
      const subscriptionInfo: SubscriptionInfo = {
        channel,
        callbacks: new Set(),
        isSubscribed: false
      };

      // Set up the postgres_changes listener BEFORE subscribing
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

      // Subscribe to the channel
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

    // Remove specific callback if provided
    if (callback) {
      subscriptionInfo.callbacks.delete(callback);
      console.log(`[REALTIME_MANAGER] Removed callback, remaining for ${tableName}: ${subscriptionInfo.callbacks.size}`);
    }

    // If no more callbacks, remove the entire subscription
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
    this.subscriptionLocks.clear();
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(key => {
      const info = this.subscriptions.get(key);
      return info?.isSubscribed || false;
    });
  }
}

export default RealtimeSubscriptionManager;
