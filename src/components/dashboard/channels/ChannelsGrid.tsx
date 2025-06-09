import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, Store, Users, Pin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChannelPin } from '@/hooks/useChannelPin';
import { useChannelConversationCounts } from '@/hooks/useChannelConversationCounts';
import { useChannelLastActivity } from '@/hooks/useChannelLastActivity';

interface Channel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ChannelsGridProps {
  isDarkMode: boolean;
  channels: Channel[];
  onChannelClick: (channelId: string) => void;
}

export const ChannelsGrid: React.FC<ChannelsGridProps> = ({
  isDarkMode,
  channels,
  onChannelClick
}) => {
  const { isPinned, togglePin } = useChannelPin();

  const getChannelIcon = (name: string) => {
    if (name.includes('Yelena') || name.includes('AI')) return Bot;
    if (name.includes('Andressa') || name.includes('Gustavo')) return Users;
    if (name.includes('Canarana') || name.includes('Souto Soares') || name.includes('João Dourado') || name.includes('América Dourada')) return Store;
    return Bot;
  };

  const getDisplayName = (name: string) => {
    if (name.includes('Yelena') || name.includes('AI')) return 'Yelena-AI';
    if (name.includes('Canarana')) return 'Canarana';
    if (name.includes('Souto Soares')) return 'Souto Soares';
    if (name.includes('João Dourado')) return 'João Dourado';
    if (name.includes('América Dourada')) return 'América Dourada';
    if (name.includes('Gerente do Externo')) return 'Andressa Gerente Externo';
    if (name.includes('Gerente das Lojas')) return 'Gustavo Gerente das Lojas';
    return name;
  };

  const getDisplayType = (name: string, type: string) => {
    if (name.includes('Yelena') || name.includes('AI')) return 'IA Assistant';
    if (name.includes('Canarana') || name.includes('Souto Soares') || name.includes('João Dourado') || name.includes('América Dourada')) return 'Loja';
    if (name.includes('Andressa') || name.includes('Gerente do Externo')) return 'Gerente Externo';
    if (name.includes('Gustavo') || name.includes('Gerente das Lojas')) return 'Gerente';
    return type === 'general' ? 'Geral' : 
           type === 'store' ? 'Loja' :
           type === 'manager' ? 'Gerência' : 'Admin';
  };

  const getChannelLegacyId = (name: string) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Óticas Villa Glamour': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gerente do Externo': 'gerente-externo',
      'Andressa': 'gerente-externo',
      'Gerente das Lojas': 'gerente-lojas',
      'Gustavo': 'gerente-lojas'
    };
    return nameToId[name] || name.toLowerCase().replace(/\s+/g, '-');
  };

  // Ordenar canais seguindo a ordem exata das imagens
  const channelOrder = [
    'Yelena-AI',
    'Canarana', 
    'Souto Soares',
    'João Dourado',
    'América Dourada',
    'Gustavo Gerente das Lojas',
    'Andressa Gerente Externo'
  ];

  const sortedChannels = [...channels].sort((a, b) => {
    const aIsPinned = isPinned(a.id);
    const bIsPinned = isPinned(b.id);
    
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    
    const aDisplayName = getDisplayName(a.name);
    const bDisplayName = getDisplayName(b.name);
    const aIndex = channelOrder.indexOf(aDisplayName);
    const bIndex = channelOrder.indexOf(bDisplayName);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return aDisplayName.localeCompare(bDisplayName);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedChannels.map((channel) => {
        const IconComponent = getChannelIcon(channel.name);
        const displayName = getDisplayName(channel.name);
        const displayType = getDisplayType(channel.name, channel.type);
        const legacyId = getChannelLegacyId(channel.name);
        
        return (
          <ChannelCardWithStats
            key={channel.id}
            channel={channel}
            displayName={displayName}
            displayType={displayType}
            legacyId={legacyId}
            IconComponent={IconComponent}
            isDarkMode={isDarkMode}
            onChannelClick={onChannelClick}
          />
        );
      })}
    </div>
  );
};

interface ChannelCardWithStatsProps {
  channel: Channel;
  displayName: string;
  displayType: string;
  legacyId: string;
  IconComponent: React.ComponentType<any>;
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
}

const ChannelCardWithStats: React.FC<ChannelCardWithStatsProps> = ({
  channel,
  displayName,
  displayType,
  legacyId,
  IconComponent,
  isDarkMode,
  onChannelClick
}) => {
  const { counts, loading: countsLoading } = useChannelConversationCounts(legacyId);
  const { lastActivityText, loading: activityLoading } = useChannelLastActivity(legacyId);
  const { isPinned, togglePin } = useChannelPin();
  
  const loading = countsLoading || activityLoading;
  const channelIsPinned = isPinned(channel.id);
  
  // Calcular notificações não lidas
  const unreadNotifications = counts.pending + counts.inProgress;

  const handleCardClick = () => {
    console.log(`🎯 [DASHBOARD_CHANNEL_CARD] Clicking channel ${displayName} with legacyId: ${legacyId}`);
    onChannelClick(legacyId);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] relative group",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" : "bg-white border-gray-200 hover:bg-gray-50",
        channelIsPinned && "ring-2 ring-[#b5103c]/30"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-md relative",
              isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
            )}>
              <IconComponent size={18} className="text-[#b5103c]" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-medium text-sm truncate flex items-center gap-1", isDarkMode ? "text-white" : "text-gray-900")}>
                {displayName}
                {channelIsPinned && (
                  <Pin size={12} className="text-[#b5103c] fill-current" />
                )}
              </h3>
              <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                {displayType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-4 bg-gray-300 rounded animate-pulse"></div>
            ) : counts.total > 0 ? (
              <Badge className="bg-[#b5103c] text-white text-xs px-2 py-1">
                {counts.total}
              </Badge>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(channel.id);
              }}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md",
                channelIsPinned && "opacity-100",
                isDarkMode ? "hover:bg-zinc-700" : "hover:bg-gray-200"
              )}
            >
              <Pin 
                size={14} 
                className={cn(
                  channelIsPinned ? "text-[#b5103c] fill-current" : (isDarkMode ? "text-gray-400" : "text-gray-600")
                )} 
              />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>
            {loading ? 'Carregando...' : lastActivityText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
