
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Store, Users, Pin } from 'lucide-react';
import { useChannelPin } from '@/hooks/useChannelPin';
import { useGlobalConversationStats } from '@/contexts/GlobalConversationStatsContext';
import { useChannelLastActivity } from '@/hooks/useChannelLastActivity';

interface ChannelCardProps {
  channelId: string;
  name: string;
  type: string;
  isDarkMode: boolean;
  onClick: (channelId: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channelId,
  name,
  type,
  isDarkMode,
  onClick
}) => {
  // Usar APENAS o contexto global centralizado - sem subscrições duplicadas
  const { getChannelStats } = useGlobalConversationStats();
  const stats = getChannelStats(channelId);
  
  const {
    isPinned,
    togglePin
  } = useChannelPin();
  
  const channelIsPinned = isPinned(channelId);

  // Hook para obter o tempo da última atividade
  const { lastActivityText, loading: activityLoading } = useChannelLastActivity(channelId);

  const getChannelIcon = (name: string) => {
    if (name.includes('Yelena') || name.includes('AI')) return Bot;
    if (name.includes('Andressa') || name.includes('Gustavo')) return Users;
    if (name.includes('Canarana') || name.includes('Souto Soares') || name.includes('João Dourado') || name.includes('América Dourada')) return Store;
    return Bot;
  };

  const getChannelDisplayName = (name: string) => {
    if (name.includes('Yelena') || name.includes('AI')) return 'Yelena-AI';
    if (name.includes('Canarana')) return 'Canarana';
    if (name.includes('Souto Soares')) return 'Souto Soares';
    if (name.includes('João Dourado')) return 'João Dourado';
    if (name.includes('América Dourada')) return 'América Dourada';
    if (name.includes('Andressa') || name.includes('Gerente do Externo')) return 'Andressa';
    if (name.includes('Gustavo') || name.includes('Gerente das Lojas')) return 'Gustavo';
    return name;
  };

  const getChannelType = (name: string) => {
    if (name.includes('Yelena') || name.includes('AI')) return 'IA Assistant';
    if (name.includes('Canarana') || name.includes('Souto Soares') || name.includes('João Dourado') || name.includes('América Dourada')) return 'Loja';
    if (name.includes('Andressa')) return 'Gerente Externo';
    if (name.includes('Gustavo')) return 'Gerente';
    return type;
  };

  const IconComponent = getChannelIcon(name);
  const displayName = getChannelDisplayName(name);
  const displayType = getChannelType(name);

  // Debug log para verificar stats
  console.log(`🔍 [CHANNEL_CARD] ${channelId} (${displayName}) stats:`, {
    totalConversations: stats.totalConversations,
    pendingConversations: stats.pendingConversations,
    unreadMessages: stats.unreadMessages,
    loading: stats.loading
  });

  if (stats.loading) {
    return (
      <Card className={cn(
        "cursor-pointer transition-all hover:shadow-md animate-pulse",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardContent className="p-4">
          <div className="h-20 bg-gray-300 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (stats.error) {
    console.error(`❌ [CHANNEL_CARD] Error for ${channelId}:`, stats.error);
  }

  return (
    <Card className={cn(
      "cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] relative group",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" : "bg-white border-gray-200 hover:bg-gray-50",
      channelIsPinned && "ring-2 ring-[#b5103c]/30"
    )} onClick={() => onClick(channelId)}>
      <CardContent className="p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-md relative",
              isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
            )}>
              <IconComponent size={18} className="text-[#b5103c]" />
              
              {/* CORRIGIDO: Badge de conversas pendentes - SEMPRE em vermelho quando > 0 */}
              {stats.pendingConversations > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">
                  {stats.pendingConversations > 99 ? '99+' : stats.pendingConversations}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium text-sm truncate flex items-center gap-1",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {displayName}
                {channelIsPinned && <Pin size={12} className="text-[#b5103c] fill-current" />}
              </h3>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {displayType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(channelId);
              }}
              className={cn(
                "p-1 rounded-md transition-opacity",
                channelIsPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                isDarkMode ? "hover:bg-zinc-700" : "hover:bg-gray-200"
              )}
            >
              <Pin size={14} className={cn(
                channelIsPinned ? "text-[#b5103c] fill-current" : (isDarkMode ? "text-gray-400" : "text-gray-600")
              )} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Tempo da última atividade */}
          <p className={cn(
            "text-xs", 
            isDarkMode ? "text-gray-500" : "text-gray-500"
          )}>
            {activityLoading ? 'Carregando...' : lastActivityText}
          </p>
          
          {/* CORRIGIDO: Mostrar total de conversas e destacar pendentes */}
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-xs font-medium",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {stats.totalConversations} {stats.totalConversations === 1 ? 'conversa' : 'conversas'}
            </p>
            {stats.pendingConversations > 0 && (
              <p className="text-xs font-bold text-red-500">
                ({stats.pendingConversations} pendente{stats.pendingConversations === 1 ? '' : 's'})
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
