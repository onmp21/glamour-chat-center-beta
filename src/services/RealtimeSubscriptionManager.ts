
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  channel: any;
  subscriptionCount: number;
  channelName: string;
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

  public createSubscription(
    channelName: string,
    callback: (payload: any) => void,
    tableName: string
  ): any {
    if (this.isShuttingDown) {
      console.warn(`[REALTIME_MANAGER] Cannot create subscription during shutdown: ${channelName}`);
      return null;
    }

    const existing = this.subscriptions.get(channelName);
    if (existing) {
      console.log(`[REALTIME_MANAGER] Reusing existing subscription: ${channelName}`);
      existing.subscriptionCount++;
      return existing.channel;
    }

    console.log(`[REALTIME_MANAGER] Creating new subscription: ${channelName}`);
    
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

    this.subscriptions.set(channelName, {
      channel,
      subscriptionCount: 1,
      channelName
    });

    return channel;
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
        supabase.removeChannel(existing.channel);
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
        supabase.removeChannel(info.channel);
      } catch (error) {
        console.warn(`[REALTIME_MANAGER] Error during cleanup: ${channelName}`, error);
      }
    }
    
    this.subscriptions.clear();
    this.isShuttingDown = false;
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export default RealtimeSubscriptionManager;
