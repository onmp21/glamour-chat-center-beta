
import React from 'react';
import { cn } from '@/lib/utils';
import { useRealConversationStatsRealtime } from '@/hooks/useRealConversationStatsRealtime';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ConversationStatsCardsRealtimeProps {
  isDarkMode: boolean;
  onCardClick?: (filter: 'total' | 'pending' | 'inProgress' | 'resolved') => void;
}

export const ConversationStatsCardsRealtime: React.FC<ConversationStatsCardsRealtimeProps> = ({
  isDarkMode,
  onCardClick
}) => {
  const { stats, loading } = useRealConversationStatsRealtime();

  console.log('📊 [STATS_CARDS_REALTIME] Rendering with stats:', stats);
  console.log('📊 [STATS_CARDS_REALTIME] Loading:', loading);

  const cards = [{
    title: 'Total',
    value: stats.total,
    filter: 'total' as const,
    icon: MessageSquare,
    color: 'bg-[#b5103c]'
  }, {
    title: 'Pendentes',
    value: stats.pending,
    filter: 'pending' as const,
    icon: AlertCircle,
    color: 'bg-red-500'
  }, {
    title: 'Em Andamento',
    value: stats.inProgress,
    filter: 'inProgress' as const,
    icon: Clock,
    color: 'bg-yellow-500'
  }, {
    title: 'Resolvidas',
    value: stats.resolved,
    filter: 'resolved' as const,
    icon: CheckCircle,
    color: 'bg-green-500'
  }];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className={cn(
            "rounded-lg border p-4 flex flex-col justify-between min-h-[100px] animate-pulse",
            isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const isClickable = onCardClick && card.filter !== 'total';
          const IconComponent = card.icon;
          
          console.log(`📊 [STATS_CARDS_REALTIME] Card ${card.title}: ${card.value} (index: ${index})`);
          
          return (
            <div 
              key={index} 
              onClick={() => isClickable && onCardClick(card.filter)} 
              className={cn(
                "rounded-lg border p-4 flex flex-col justify-between min-h-[100px] transition-all duration-200",
                isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200",
                isClickable && "cursor-pointer hover:shadow-lg transform hover:scale-105",
                isClickable && isDarkMode && "hover:bg-[#1f1f23]",
                isClickable && !isDarkMode && "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent size={16} className="text-[#b5103c]" />
                    <h3 className={cn(
                      "text-xs font-medium",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {card.title}
                    </h3>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {card.value}
                  </p>
                </div>
                {isClickable && (
                  <div className={cn(
                    "text-xs opacity-0 transition-opacity hover:opacity-100",
                    isDarkMode ? "text-zinc-400" : "text-gray-500"
                  )}>
                    Clique para filtrar
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
