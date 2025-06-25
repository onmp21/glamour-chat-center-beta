
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { CHANNEL_TABLE_MAPPING } from '@/utils/channelMapping';

interface ChannelStats {
  totalConversations: number;
  unreadMessages: number;
  pendingConversations: number;
  loading: boolean;
  error: string | null;
}

interface TotalStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  loading: boolean;
  error: string;
}

interface GlobalConversationStatsContextType {
  getChannelStats: (channelId: string) => ChannelStats;
  getTotalStats: () => TotalStats;
  refreshStats: () => Promise<void>;
  isInitialized: boolean;
}

const GlobalConversationStatsContext = createContext<GlobalConversationStatsContextType | undefined>(undefined);

export const useGlobalConversationStats = () => {
  const context = useContext(GlobalConversationStatsContext);
  if (!context) {
    throw new Error('useGlobalConversationStats must be used within a GlobalConversationStatsProvider');
  }
  return context;
};

export const GlobalConversationStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [channelStats, setChannelStats] = useState<Record<string, ChannelStats>>({});
  const [totalStats, setTotalStats] = useState<TotalStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    loading: true,
    error: ''
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated } = useAuth();

  // Helper function to get actual conversation statuses from localStorage unified system
  const getConversationStatusesFromStorage = (channelId: string, sessionIds: string[]): Record<string, 'unread' | 'in_progress' | 'resolved'> => {
    const statuses: Record<string, 'unread' | 'in_progress' | 'resolved'> = {};
    
    sessionIds.forEach(sessionId => {
      const statusKey = `unified_status_${channelId}_${sessionId}`;
      const savedData = localStorage.getItem(statusKey);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          statuses[sessionId] = parsed.status || 'unread';
        } catch (error) {
          console.error(`❌ [GLOBAL_STATS] Error parsing status for ${sessionId}:`, error);
          statuses[sessionId] = 'unread'; // Default to unread if parsing fails
        }
      } else {
        statuses[sessionId] = 'unread'; // Default to unread if no status saved
      }
    });
    
    return statuses;
  };

  const refreshStats = useCallback(async () => {
    if (!isAuthenticated) return;

    console.log('🔄 [GLOBAL_STATS] Refreshing all channel stats using unified status system');
    
    try {
      setTotalStats(prev => ({ ...prev, loading: true }));
      
      const newChannelStats: Record<string, ChannelStats> = {};
      let totalConversations = 0;
      let totalPending = 0;
      let totalInProgress = 0;
      let totalResolved = 0;
      let totalUnread = 0;

      // Process each channel using RPC functions for compatibility
      for (const [channelId, tableName] of Object.entries(CHANNEL_TABLE_MAPPING)) {
        try {
          console.log(`📊 [GLOBAL_STATS] Processing channel ${channelId} -> ${tableName}`);

          // Get unique sessions and unread count from database
          const [uniqueSessionsResult, unreadTotalResult] = await Promise.all([
            supabase.rpc('count_unique_sessions', { table_name: tableName }),
            supabase.rpc('count_unread_messages_total', { table_name: tableName })
          ]);

          if (uniqueSessionsResult.error || unreadTotalResult.error) {
            console.error(`❌ [GLOBAL_STATS] Error getting stats for ${channelId}:`, {
              sessionsError: uniqueSessionsResult.error,
              unreadError: unreadTotalResult.error
            });
            
            newChannelStats[channelId] = {
              totalConversations: 0,
              unreadMessages: 0,
              pendingConversations: 0,
              loading: false,
              error: 'Erro ao carregar estatísticas'
            };
            continue;
          }

          const totalSessions = uniqueSessionsResult.data || 0;
          const unreadMessages = unreadTotalResult.data || 0;
          
          // Get actual session IDs to check their statuses
          const { data: sessionsData, error: sessionsError } = await supabase
            .from(tableName as any)
            .select('session_id')
            .not('session_id', 'is', null);

          if (sessionsError) {
            console.error(`❌ [GLOBAL_STATS] Error getting sessions for ${channelId}:`, sessionsError);
            newChannelStats[channelId] = {
              totalConversations: totalSessions,
              unreadMessages: unreadMessages,
              pendingConversations: 0,
              loading: false,
              error: 'Erro ao carregar sessões'
            };
            continue;
          }

          // Get unique session IDs
          const uniqueSessionIds = [...new Set(
            (sessionsData || [])
              .map((row: any) => row.session_id)
              .filter(sessionId => sessionId && sessionId.trim() !== '')
          )];

          console.log(`📋 [GLOBAL_STATS] Found ${uniqueSessionIds.length} unique sessions for ${channelId}`);

          // Get actual statuses from unified status system
          const conversationStatuses = getConversationStatusesFromStorage(channelId, uniqueSessionIds);
          
          // Count conversations by status
          let pendingCount = 0;
          let inProgressCount = 0;
          let resolvedCount = 0;

          Object.values(conversationStatuses).forEach(status => {
            switch (status) {
              case 'unread':
                pendingCount++;
                break;
              case 'in_progress':
                inProgressCount++;
                break;
              case 'resolved':
                resolvedCount++;
                break;
            }
          });

          console.log(`📊 [GLOBAL_STATS] Status breakdown for ${channelId}:`, {
            pending: pendingCount,
            inProgress: inProgressCount,
            resolved: resolvedCount,
            total: uniqueSessionIds.length
          });

          const stats: ChannelStats = {
            totalConversations: totalSessions,
            unreadMessages: unreadMessages,
            pendingConversations: pendingCount, // Use actual pending count from status system
            loading: false,
            error: null
          };

          newChannelStats[channelId] = stats;
          totalConversations += stats.totalConversations;
          totalPending += pendingCount;
          totalInProgress += inProgressCount;
          totalResolved += resolvedCount;
          totalUnread += stats.unreadMessages;
          
          console.log(`✅ [GLOBAL_STATS] Stats for ${channelId}:`, {
            conversations: stats.totalConversations,
            pending: stats.pendingConversations,
            unread: stats.unreadMessages
          });

        } catch (error) {
          console.error(`❌ [GLOBAL_STATS] Error processing channel ${channelId}:`, error);
          newChannelStats[channelId] = {
            totalConversations: 0,
            unreadMessages: 0,
            pendingConversations: 0,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      setChannelStats(newChannelStats);
      
      // Set accurate totals based on unified status system
      setTotalStats({
        total: totalConversations,
        pending: totalPending, // Now using actual pending count from status system
        inProgress: totalInProgress, // Actual in progress count
        resolved: totalResolved, // Actual resolved count
        loading: false,
        error: ''
      });

      console.log('✅ [GLOBAL_STATS] ACCURATE TOTALS using unified status system:', {
        total: totalConversations,
        pending: totalPending,
        inProgress: totalInProgress,
        resolved: totalResolved,
        totalUnread: totalUnread
      });

      setIsInitialized(true);

    } catch (error) {
      console.error('❌ [GLOBAL_STATS] Error refreshing stats:', error);
      setTotalStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshStats();
    }
  }, [isAuthenticated, refreshStats]);

  // Refresh periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshStats]);

  const getChannelStats = useCallback((channelId: string): ChannelStats => {
    return channelStats[channelId] || {
      totalConversations: 0,
      unreadMessages: 0,
      pendingConversations: 0,
      loading: !isInitialized,
      error: null
    };
  }, [channelStats, isInitialized]);

  const getTotalStats = useCallback((): TotalStats => {
    return totalStats;
  }, [totalStats]);

  return (
    <GlobalConversationStatsContext.Provider 
      value={{ 
        getChannelStats, 
        getTotalStats, 
        refreshStats, 
        isInitialized 
      }}
    >
      {children}
    </GlobalConversationStatsContext.Provider>
  );
};
