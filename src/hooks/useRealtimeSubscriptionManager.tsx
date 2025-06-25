
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  tableName: string;
  callback: (payload: any) => void;
  filter?: string;
}

/**
 * Hook centralizado para gerenciar subscrições de tempo real de forma segura
 * Evita múltiplas subscrições e garante limpeza adequada
 */
export const useRealtimeSubscriptionManager = () => {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const mountedRef = useRef(true);

  // Cleanup geral quando o componente for desmontado
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanupAllSubscriptions();
    };
  }, []);

  const createSubscription = (channelName: string, config: SubscriptionConfig) => {
    // Se já existe uma subscrição ativa, removê-la primeiro
    if (channelsRef.current.has(channelName)) {
      const existingChannel = channelsRef.current.get(channelName);
      if (existingChannel) {
        console.log(`🔄 [REALTIME_MANAGER] Removing existing subscription: ${channelName}`);
        supabase.removeChannel(existingChannel);
        channelsRef.current.delete(channelName);
      }
    }

    console.log(`✅ [REALTIME_MANAGER] Creating subscription: ${channelName} for table ${config.tableName}`);

    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: config.tableName,
            ...(config.filter && { filter: config.filter })
          },
          (payload) => {
            if (mountedRef.current) {
              console.log(`🔥 [REALTIME_MANAGER] Data change in ${config.tableName}:`, payload.eventType);
              config.callback(payload);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 [REALTIME_MANAGER] Subscription status for ${channelName}:`, status);
          if (status === 'CHANNEL_ERROR') {
            console.error(`❌ [REALTIME_MANAGER] Channel error for ${channelName}`);
            channelsRef.current.delete(channelName);
          }
        });

      channelsRef.current.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`❌ [REALTIME_MANAGER] Error creating subscription ${channelName}:`, error);
      return null;
    }
  };

  const removeSubscription = (channelName: string) => {
    const channel = channelsRef.current.get(channelName);
    if (channel) {
      console.log(`🔌 [REALTIME_MANAGER] Removing subscription: ${channelName}`);
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelName);
    }
  };

  const cleanupAllSubscriptions = () => {
    console.log(`🧹 [REALTIME_MANAGER] Cleaning up all subscriptions`);
    channelsRef.current.forEach((channel, channelName) => {
      try {
        supabase.removeChannel(channel);
        console.log(`✅ [REALTIME_MANAGER] Removed subscription: ${channelName}`);
      } catch (error) {
        console.error(`❌ [REALTIME_MANAGER] Error removing subscription ${channelName}:`, error);
      }
    });
    channelsRef.current.clear();
  };

  return {
    createSubscription,
    removeSubscription,
    cleanupAllSubscriptions,
    activeSubscriptions: channelsRef.current.size
  };
};
