
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageCircle, Pin, PinOff, Users, Bot, Store, User } from 'lucide-react';

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
  const [pinnedChannels, setPinnedChannels] = React.useState<Set<string>>(new Set());

  const togglePin = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    setPinnedChannels(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(channelId)) {
        newPinned.delete(channelId);
      } else {
        newPinned.add(channelId);
      }
      return newPinned;
    });
  };

  const getChannelIcon = (tipo: string) => {
    switch (tipo) {
      case 'IA Assistant':
        return <Bot size={20} className="text-blue-500" />;
      case 'Loja':
        return <Store size={20} className="text-green-500" />;
      case 'Gerente':
        return <User size={20} className="text-purple-500" />;
      default:
        return <Users size={20} className="text-gray-500" />;
    }
  };

  const sortedChannels = React.useMemo(() => {
    return [...channels].sort((a, b) => {
      // Canais fixados primeiro
      const aIsPinned = pinnedChannels.has(a.id);
      const bIsPinned = pinnedChannels.has(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // Depois por conversas não lidas
      if (a.conversasNaoLidas !== b.conversasNaoLidas) {
        return b.conversasNaoLidas - a.conversasNaoLidas;
      }
      
      // Por último, alfabético
      return a.nome.localeCompare(b.nome);
    });
  }, [channels, pinnedChannels]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedChannels.map((channel) => (
        <Card
          key={channel.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:scale-105 group relative overflow-hidden",
            isDarkMode ? "bg-[#18181b] border-[#3f3f46] hover:border-[#52525b]" : "bg-white border-gray-200 hover:border-gray-300",
            pinnedChannels.has(channel.id) && "ring-2 ring-blue-500 ring-opacity-50",
            channel.conversasNaoLidas > 0 && "shadow-lg"
          )}
          onClick={() => onChannelClick(channel.id)}
        >
          <CardContent className="p-4 relative">
            {/* Pin Button - Posição fixa no canto superior direito */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => togglePin(e, channel.id)}
              className={cn(
                "absolute top-2 right-2 p-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10",
                pinnedChannels.has(channel.id) && "opacity-100"
              )}
            >
              {pinnedChannels.has(channel.id) ? (
                <PinOff size={14} className="text-blue-500" />
              ) : (
                <Pin size={14} className="text-gray-500" />
              )}
            </Button>

            {/* Badge de Mensagens - Posição fixa independente do botão de pin */}
            {channel.conversasNaoLidas > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute top-2 left-2 h-6 min-w-[24px] flex items-center justify-center text-xs font-bold z-10"
              >
                {channel.conversasNaoLidas > 99 ? '99+' : channel.conversasNaoLidas}
              </Badge>
            )}

            <div className="space-y-3 mt-2">
              {/* Header do Canal */}
              <div className="flex items-center gap-3">
                {getChannelIcon(channel.tipo)}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-sm truncate",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {channel.nome}
                  </h3>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {channel.tipo}
                  </p>
                </div>
              </div>

              {/* Status e Última Atividade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={channel.status === 'ativo' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {channel.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={12} className="text-gray-400" />
                    <span className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      {channel.ultimaAtividade}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay de hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none",
              isDarkMode ? "bg-white" : "bg-black"
            )} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
