
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Store, Users, Pin } from 'lucide-react';
import { useRealtimeChannelStats } from '@/hooks/useRealtimeChannelStats';
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
  // Usar apenas realtime - REMOVIDO POLLING
  const {
    totalConversations,
    unreadMessages,
    loading,
    error
  } = useRealtimeChannelStats(channelId);
  
  const {
    isPinned,
    togglePin
  } = useChannelPin();
  
  const channelIsPinned = isPinned(channelId);

  // Corrigido: usar unreadMessages diretamente para badge
  const unreadCount = unreadMessages;
  const totalCount = totalConversations;
  
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

  if (error) {
    console.error(`❌ [CHANNEL_CARD] Error for ${channelId}:`, error);
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
              
              {/* Badge de contagem no canto superior esquerdo do ícone - apenas se houver conversas não lidas */}
              {unreadCount > 0 && (
                <div className={cn(
                  "absolute -top-1 -left-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg",
                  "bg-[#b5103c]"
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
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
            {loading ? 'Carregando...' : 'Atualizado em tempo real'}
          </p>
          
          {/* Texto de contagem total de conversas - formatado corretamente */}
          <p className={cn(
            "text-xs font-medium",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {totalCount} {totalCount === 1 ? 'conversa' : 'conversas'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
