
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
  nome: string;
  tipo: string;
  status: string;
  conversasNaoLidas: number;
  ultimaAtividade: string;
}

interface ChannelsGridProps {
  channels: Channel[];
  onChannelClick: (channelId: string) => void;
  isDarkMode: boolean;
}

export const ChannelsGrid: React.FC<ChannelsGridProps> = ({
  channels,
  onChannelClick,
  isDarkMode
}) => {
  const { isPinned, togglePin } = useChannelPin();

  const getChannelIcon = (nome: string) => {
    if (nome.includes('Yelena') || nome.includes('AI') || nome.includes('Óticas Villa Glamour')) return Bot;
    if (nome.includes('Andressa') || nome.includes('Gustavo')) return Users;
    if (nome.includes('Canarana') || nome.includes('Souto Soares') || nome.includes('João Dourado') || nome.includes('América Dourada')) return Store;
    return Bot;
  };

  const getDisplayName = (nome: string) => {
    if (nome.includes('Yelena') || nome.includes('AI') || nome.includes('Óticas Villa Glamour')) return 'Óticas Villa Glamour';
    if (nome.includes('Canarana')) return 'Canarana';
    if (nome.includes('Souto Soares')) return 'Souto Soares';
    if (nome.includes('João Dourado')) return 'João Dourado';
    if (nome.includes('América Dourada')) return 'América Dourada';
    if (nome.includes('Andressa')) return 'Andressa Gerente Externo';
    if (nome.includes('Gustavo')) return 'Gustavo Gerente das Lojas';
    return nome;
  };

  const getDisplayType = (tipo: string, nome: string) => {
    if (nome.includes('Yelena') || nome.includes('AI') || nome.includes('Óticas Villa Glamour')) return 'IA Assistant';
    if (nome.includes('Canarana') || nome.includes('Souto Soares') || nome.includes('João Dourado') || nome.includes('América Dourada')) return 'Loja';
    if (nome.includes('Andressa')) return 'Gerente Externo';
    if (nome.includes('Gustavo')) return 'Gerente';
    return tipo;
  };

  // Ordenar canais seguindo a ordem exata das imagens
  const channelOrder = [
    'Óticas Villa Glamour',
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
    
    const aDisplayName = getDisplayName(a.nome);
    const bDisplayName = getDisplayName(b.nome);
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
        const IconComponent = getChannelIcon(channel.nome);
        const displayName = getDisplayName(channel.nome);
        const displayType = getDisplayType(channel.tipo, channel.nome);
        
        return (
          <ChannelCardWithStats
            key={channel.id}
            channel={channel}
            displayName={displayName}
            displayType={displayType}
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
  IconComponent: React.ComponentType<any>;
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
}

const ChannelCardWithStats: React.FC<ChannelCardWithStatsProps> = ({
  channel,
  displayName,
  displayType,
  IconComponent,
  isDarkMode,
  onChannelClick
}) => {
  const { counts, loading: countsLoading } = useChannelConversationCounts(channel.id);
  const { lastActivityText, loading: activityLoading } = useChannelLastActivity(channel.id);
  const { isPinned, togglePin } = useChannelPin();
  
  const loading = countsLoading || activityLoading;
  const channelIsPinned = isPinned(channel.id);
  
  // Calcular notificações não lidas
  const unreadNotifications = counts.pending + counts.inProgress;

  const handleCardClick = () => {
    console.log(`🎯 [MENSAGENS_CHANNEL_CARD] Clicking channel ${displayName} with id: ${channel.id}`);
    onChannelClick(channel.id);
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
              {/* Badge de Mensagens - Posição absoluta fixa */}
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-[#b5103c] text-white h-5 min-w-[20px] flex items-center justify-center text-xs font-bold px-1">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-medium text-sm truncate flex items-center gap-1", isDarkMode ? "text-[#ffffff]" : "text-gray-900")}>
                {displayName}
                {channelIsPinned && (
                  <Pin size={12} className="text-[#b5103c] fill-current" />
                )}
              </h3>
              <p className={cn("text-xs", isDarkMode ? "text-[#9ca3af]" : "text-gray-600")}>
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
            {/* Pin Button - Sempre visível */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(channel.id);
              }}
              className={cn(
                "transition-opacity p-1 rounded-md",
                isDarkMode ? "hover:bg-[#27272a]" : "hover:bg-gray-200"
              )}
            >
              <Pin 
                size={14} 
                className={cn(
                  channelIsPinned ? "text-[#b5103c] fill-current" : (isDarkMode ? "text-[#9ca3af]" : "text-gray-600")
                )} 
              />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className={cn("text-xs", isDarkMode ? "text-[#9ca3af]" : "text-gray-500")}>
            {loading ? 'Carregando...' : lastActivityText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
