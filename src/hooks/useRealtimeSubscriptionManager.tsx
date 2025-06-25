
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  tableName: string;
  callback: (payload: any) => void;
  filter?: string;
}

// Global singleton to prevent multiple subscriptions
class GlobalSubscriptionManager {
  private static instance: GlobalSubscriptionManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, Set<(payload: any) => void>> = new Map();
  private subscriptionStatus: Map<string, 'pending' | 'subscribed' | 'error'> = new Map();
  private subscriptionPromises: Map<string, Promise<void>> = new Map();
  private subscriptionCounter = 0;

  static getInstance(): GlobalSubscriptionManager {
    if (!GlobalSubscriptionManager.instance) {
      GlobalSubscriptionManager.instance = new GlobalSubscriptionManager();
    }
    return GlobalSubscriptionManager.instance;
  }

  private getChannelKey(tableName: string, filter?: string): string {
    return `${tableName}${filter ? `_${filter}` : ''}`;
  }

  addCallback = async (tableName: string, callback: (payload: any) => void, filter?: string): Promise<void> => {
    const channelKey = this.getChannelKey(tableName, filter);
    
    if (!this.callbacks.has(channelKey)) {
      this.callbacks.set(channelKey, new Set());
    }
    
    this.callbacks.get(channelKey)!.add(callback);
    
    // Create subscription if it doesn't exist and isn't being created
    if (!this.channels.has(channelKey) && !this.subscriptionPromises.has(channelKey)) {
      const subscriptionPromise = this.createSubscription(channelKey, tableName, filter);
      this.subscriptionPromises.set(channelKey, subscriptionPromise);
      
      try {
        await subscriptionPromise;
      } catch (error) {
        console.error(`❌ [GLOBAL_SUB_MANAGER] Failed to create subscription ${channelKey}:`, error);
        this.subscriptionPromises.delete(channelKey);
        throw error;
      }
    } else if (this.subscriptionPromises.has(channelKey)) {
      // Wait for existing subscription creation to complete
      await this.subscriptionPromises.get(channelKey);
    }
  };

  removeCallback = (tableName: string, callback: (payload: any) => void, filter?: string): void => {
    const channelKey = this.getChannelKey(tableName, filter);
    const callbackSet = this.callbacks.get(channelKey);
    
    if (callbackSet) {
      callbackSet.delete(callback);
      
      // If no more callbacks, remove the subscription
      if (callbackSet.size === 0) {
        this.removeSubscription(channelKey);
        this.callbacks.delete(channelKey);
      }
    }
  };

  private createSubscription = async (channelKey: string, tableName: string, filter?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this.channels.has(channelKey)) {
        console.log(`⚠️ [GLOBAL_SUB_MANAGER] Subscription ${channelKey} already exists`);
        resolve();
        return;
      }

      // Mark as pending
      this.subscriptionStatus.set(channelKey, 'pending');

      // Generate unique channel name to avoid conflicts
      const uniqueChannelName = `${channelKey}_${Date.now()}_${++this.subscriptionCounter}`;
      
      console.log(`✅ [GLOBAL_SUB_MANAGER] Creating NEW subscription: ${uniqueChannelName} for table ${tableName}`);

      try {
        const channel = supabase.channel(uniqueChannelName);
        
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: tableName,
              ...(filter && { filter })
            },
            (payload) => {
              console.log(`🔥 [GLOBAL_SUB_MANAGER] Data change in ${tableName}:`, payload.eventType);
              
              // Notify all callbacks for this channel
              const callbackSet = this.callbacks.get(channelKey);
              if (callbackSet) {
                callbackSet.forEach(callback => {
                  try {
                    callback(payload);
                  } catch (error) {
                    console.error(`❌ [GLOBAL_SUB_MANAGER] Error in callback for ${channelKey}:`, error);
                  }
                });
              }
            }
          )
          .subscribe((status) => {
            console.log(`📡 [GLOBAL_SUB_MANAGER] Subscription status for ${uniqueChannelName}:`, status);
            
            if (status === 'SUBSCRIBED') {
              this.channels.set(channelKey, channel);
              this.subscriptionStatus.set(channelKey, 'subscribed');
              this.subscriptionPromises.delete(channelKey);
              resolve();
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`❌ [GLOBAL_SUB_MANAGER] Channel error for ${uniqueChannelName}`);
              this.subscriptionStatus.set(channelKey, 'error');
              this.channels.delete(channelKey);
              this.subscriptionPromises.delete(channelKey);
              reject(new Error(`Channel error for ${uniqueChannelName}`));
            } else if (status === 'CLOSED') {
              this.subscriptionStatus.delete(channelKey);
              this.channels.delete(channelKey);
              this.subscriptionPromises.delete(channelKey);
            }
          });

      } catch (error) {
        console.error(`❌ [GLOBAL_SUB_MANAGER] Error creating subscription ${channelKey}:`, error);
        this.subscriptionStatus.set(channelKey, 'error');
        this.subscriptionPromises.delete(channelKey);
        reject(error);
      }
    });
  };

  private removeSubscription = (channelKey: string): void => {
    const channel = this.channels.get(channelKey);
    if (channel) {
      console.log(`🔌 [GLOBAL_SUB_MANAGER] Removing subscription: ${channelKey}`);
      try {
        supabase.removeChannel(channel);
        this.channels.delete(channelKey);
        this.subscriptionStatus.delete(channelKey);
        this.subscriptionPromises.delete(channelKey);
      } catch (error) {
        console.error(`❌ [GLOBAL_SUB_MANAGER] Error removing subscription ${channelKey}:`, error);
      }
    }
  };

  hasSubscription = (tableName: string, filter?: string): boolean => {
    const channelKey = this.getChannelKey(tableName, filter);
    return this.channels.has(channelKey) || this.subscriptionStatus.get(channelKey) === 'pending';
  };

  cleanupAll = (): void => {
    console.log(`🧹 [GLOBAL_SUB_MANAGER] Cleaning up ${this.channels.size} subscriptions`);
    
    this.channels.forEach((channel, channelKey) => {
      try {
        supabase.removeChannel(channel);
        console.log(`✅ [GLOBAL_SUB_MANAGER] Removed subscription: ${channelKey}`);
      } catch (error) {
        console.error(`❌ [GLOBAL_SUB_MANAGER] Error removing subscription ${channelKey}:`, error);
      }
    });
    
    this.channels.clear();
    this.callbacks.clear();
    this.subscriptionStatus.clear();
    this.subscriptionPromises.clear();
  };

  getActiveCount = (): number => {
    return this.channels.size;
  };
}

/**
 * Hook that uses the global subscription manager
 */
export const useRealtimeSubscriptionManager = () => {
  const managerRef = useRef<GlobalSubscriptionManager>();
  const mountedRef = useRef(true);

  // Initialize manager
  useEffect(() => {
    mountedRef.current = true;
    managerRef.current = GlobalSubscriptionManager.getInstance();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const addTableSubscription = async (tableName: string, callback: (payload: any) => void, filter?: string) => {
    if (!mountedRef.current || !managerRef.current) {
      console.warn('⚠️ [REALTIME_MANAGER] Component unmounted or manager not initialized');
      return;
    }
    
    try {
      await managerRef.current.addCallback(tableName, callback, filter);
    } catch (error) {
      console.error('❌ [REALTIME_MANAGER] Failed to add subscription:', error);
    }
  };

  const removeTableSubscription = (tableName: string, callback: (payload: any) => void, filter?: string) => {
    if (managerRef.current) {
      managerRef.current.removeCallback(tableName, callback, filter);
    }
  };

  const hasSubscription = (tableName: string, filter?: string): boolean => {
    return managerRef.current ? managerRef.current.hasSubscription(tableName, filter) : false;
  };

  const cleanupAllSubscriptions = () => {
    if (managerRef.current) {
      managerRef.current.cleanupAll();
    }
  };

  return {
    addTableSubscription,
    removeTableSubscription,
    cleanupAllSubscriptions,
    hasSubscription,
    activeSubscriptions: managerRef.current ? managerRef.current.getActiveCount() : 0
  };
};
