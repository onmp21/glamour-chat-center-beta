
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Store, Users, Pin } from 'lucide-react';
import { useChannelConversationCounts } from '@/hooks/useChannelConversationCounts';
import { useChannelLastActivity } from '@/hooks/useChannelLastActivity';
import { useChannelPin } from '@/hooks/useChannelPin';

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
  const {
    counts,
    loading: countsLoading
  } = useChannelConversationCounts(channelId);
  const {
    lastActivityText,
    loading: activityLoading
  } = useChannelLastActivity(channelId);
  const {
    isPinned,
    togglePin
  } = useChannelPin();
  
  const loading = countsLoading || activityLoading;
  const channelIsPinned = isPinned(channelId);

  // Calcular notificações não lidas
  const unreadNotifications = counts.pending + counts.inProgress;
  
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
    if (name.includes('Andressa') || name.includes('Gerente do Externo')) return 'Andressa Gerente Externo';
    if (name.includes('Gustavo') || name.includes('Gerente das Lojas')) return 'Gustavo Gerente das Lojas';
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

  if (loading) {
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
            {counts.total > 0 && (
              <Badge className="text-white text-xs bg-zinc-900 px-[2px] py-0">
                {counts.total}
              </Badge>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(channelId);
              }}
              className={cn(
                "p-1 rounded-md",
                channelIsPinned && "opacity-100",
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
          <p className={cn(
            "text-xs",
            isDarkMode ? "text-gray-500" : "text-gray-500"
          )}>
            {loading ? 'Carregando...' : lastActivityText}
          </p>
        </div>

        {/* Badge de notificações não lidas - movido para canto inferior direito */}
        {unreadNotifications > 0 && (
          <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium shadow-lg">
            {unreadNotifications > 99 ? '99+' : unreadNotifications}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
