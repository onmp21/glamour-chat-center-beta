import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Store, Users, Pin } from 'lucide-react';
import { useChannelPin } from '@/hooks/useChannelPin';
import { useChannelConversationCounts } from '@/hooks/useChannelConversationCounts';
import { useChannelLastActivity } from '@/hooks/useChannelLastActivity';

interface Channel {
  id: string;
  nome: string;
  tipo: string;
  status: 'ativo' | 'inativo';
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
  const { pinnedChannels, togglePin, isPinned } = useChannelPin();

  const getChannelIcon = (nome: string) => {
    if (nome.includes('Yelena') || nome.includes('AI')) return Bot;
    if (nome.includes('Andressa') || nome.includes('Gustavo')) return Users;
    if (nome.includes('Canarana') || nome.includes('Souto Soares') || nome.includes('João Dourado') || nome.includes('América Dourada')) return Store;
    return Bot;
  };

  const getChannelName = (nome: string) => {
    if (nome === 'Óticas Villa Glamour' || nome === 'Yelena-AI') return 'Yelena-AI';
    if (nome === 'Canarana WhatsApp') return 'Canarana';
    if (nome === 'Souto Soares WhatsApp') return 'Souto Soares';
    if (nome === 'João Dourado WhatsApp') return 'João Dourado';
    if (nome === 'América Dourada WhatsApp') return 'América Dourada';
    return nome;
  };

  const getChannelType = (nome: string) => {
    if (nome.includes('Yelena') || nome.includes('AI')) return 'IA Assistant';
    if (nome.includes('Canarana') || nome.includes('Souto Soares') || nome.includes('João Dourado') || nome.includes('América Dourada')) return 'Loja';
    if (nome.includes('Andressa')) return 'Gerente Externo';
    if (nome.includes('Gustavo')) return 'Gerente';
    return nome.split(' ').pop() || nome;
  };

  const getChannelLegacyId = (nome: string) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Óticas Villa Glamour': 'chat',
      'Canarana': 'canarana',
      'Canarana WhatsApp': 'canarana',
      'Souto Soares': 'souto-soares',
      'Souto Soares WhatsApp': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'João Dourado WhatsApp': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'América Dourada WhatsApp': 'america-dourada',
      'Andressa Gerente Externo': 'gerente-externo',
      'Gustavo Gerente das Lojas': 'gerente-lojas'
    };
    return nameToId[nome] || nome.toLowerCase().replace(/\s+/g, '-');
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
    
    const aDisplayName = getChannelName(a.nome);
    const bDisplayName = getChannelName(b.nome);
    const aIndex = channelOrder.indexOf(aDisplayName);
    const bIndex = channelOrder.indexOf(bDisplayName);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return aDisplayName.localeCompare(bDisplayName);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {sortedChannels.map((channel) => {
        const IconComponent = getChannelIcon(channel.nome);
        const displayName = getChannelName(channel.nome);
        const displayType = getChannelType(channel.nome);
        const channelIsPinned = isPinned(channel.id);
        const legacyId = getChannelLegacyId(channel.nome);
        
        return (
          <ChannelCardWithStats
            key={channel.id}
            channel={channel}
            displayName={displayName}
            displayType={displayType}
            legacyId={legacyId}
            IconComponent={IconComponent}
            channelIsPinned={channelIsPinned}
            isDarkMode={isDarkMode}
            onChannelClick={onChannelClick}
            onTogglePin={() => togglePin(channel.id)}
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
  channelIsPinned: boolean;
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
  onTogglePin: () => void;
}

const ChannelCardWithStats: React.FC<ChannelCardWithStatsProps> = ({
  channel,
  displayName,
  displayType,
  legacyId,
  IconComponent,
  channelIsPinned,
  isDarkMode,
  onChannelClick,
  onTogglePin
}) => {
  const { counts, loading: countsLoading } = useChannelConversationCounts(legacyId);
  const { lastActivityText, loading: activityLoading } = useChannelLastActivity(legacyId);
  
  const loading = countsLoading || activityLoading;
  
  // Calcular notificações não lidas (seguindo padrão do dashboard)
  const unreadNotifications = counts.pending + counts.inProgress;

  const handleCardClick = () => {
    console.log(`🎯 [CHANNEL_CARD] Clicking channel ${displayName} with legacyId: ${legacyId}`);
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
                onTogglePin();
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
