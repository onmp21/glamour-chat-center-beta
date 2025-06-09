
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
        return <Bot size={20} className="text-[#b5103c]" />;
      case 'Loja':
        return <Store size={20} className="text-[#b5103c]" />;
      case 'Gerente':
        return <User size={20} className="text-[#b5103c]" />;
      default:
        return <Users size={20} className="text-[#b5103c]" />;
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
            pinnedChannels.has(channel.id) && "ring-2 ring-[#b5103c] ring-opacity-50",
            channel.conversasNaoLidas > 0 && "shadow-lg"
          )}
          onClick={() => onChannelClick(channel.id)}
        >
          <CardContent className="p-4 relative">
            <div className="space-y-3">
              {/* Header do Canal */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-md relative",
                  isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
                )}>
                  {getChannelIcon(channel.tipo)}
                  {/* Badge de Mensagens - Posição absoluta fixa */}
                  {channel.conversasNaoLidas > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 bg-[#b5103c] text-white h-5 min-w-[20px] flex items-center justify-center text-xs font-bold px-1"
                    >
                      {channel.conversasNaoLidas > 99 ? '99+' : channel.conversasNaoLidas}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-semibold text-sm truncate flex items-center gap-1",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {channel.nome}
                      {pinnedChannels.has(channel.id) && (
                        <Pin size={12} className="text-[#b5103c] fill-current" />
                      )}
                    </h3>
                    {/* Pin Button - Só aparece no hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => togglePin(e, channel.id)}
                      className={cn(
                        "p-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        pinnedChannels.has(channel.id) && "opacity-100"
                      )}
                    >
                      {pinnedChannels.has(channel.id) ? (
                        <PinOff size={14} className="text-[#b5103c]" />
                      ) : (
                        <Pin size={14} className="text-gray-500" />
                      )}
                    </Button>
                  </div>
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
                    className={cn(
                      "text-xs",
                      channel.status === 'ativo' 
                        ? "bg-[#b5103c] text-white" 
                        : "bg-gray-400 text-white"
                    )}
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
