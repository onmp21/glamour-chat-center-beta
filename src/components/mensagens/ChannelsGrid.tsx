
import React from 'react';
import { cn } from '@/lib/utils';
import { useChannelPin } from '@/hooks/useChannelPin';
import { Pin } from 'lucide-react';

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

export const ChannelsGrid: React.FC<ChannelsGridProps> = ({ channels, onChannelClick, isDarkMode }) => {
  const { isPinned, togglePin } = useChannelPin();

  if (channels.length === 0) {
    // Estado vazio com padrão de cor correto
    return (
      <div className={cn(
        "w-full flex flex-col items-center justify-center",
        isDarkMode ? "bg-[#09090b] text-[#9ca3af] min-h-[240px]" : "bg-white text-gray-500 min-h-[240px]"
      )}>
        <div className={cn("text-center px-6 py-12 rounded-lg border-2 border-dashed",
          isDarkMode ? "border-[#27272a]" : "border-gray-200"
        )}>
          <p className={cn("font-medium text-base", isDarkMode ? "text-white" : "text-gray-800")}>
            Nenhum canal disponível
          </p>
          <p className={cn("mt-2 text-sm", isDarkMode ? "text-[#9ca3af]" : "text-gray-500")}>
            Você ainda não tem canal cadastrado ou não tem permissão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {channels.map(channel => {
        const channelIsPinned = isPinned(channel.id);

        return (
          <div
            key={channel.id}
            className={cn(
              "relative p-4 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col shadow-sm",
              isDarkMode
                  ? "bg-[#18181b] border-[#27272a] hover:bg-[#232327]"
                  : "bg-white border-gray-200 hover:bg-gray-100",
              channelIsPinned && "ring-2 ring-[#b5103c]/30"
            )}
            onClick={() => {
              console.log(`📺 [CHANNELS_GRID] Clicking channel: ${channel.nome}, ID: ${channel.id}`);
              onChannelClick(channel.id);
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className={cn(
                  "font-bold text-lg truncate",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {channel.nome}
                </h3>
                <p className={cn(
                  "text-xs font-medium rounded px-2 py-0.5 mt-1 inline-block",
                  isDarkMode ? "bg-[#27272a] text-[#b5103c]" : "bg-[#b5103c]/10 text-[#b5103c]"
                )}>{channel.tipo}</p>
                <div className={cn(
                  "mt-2 text-xs font-semibold",
                  isDarkMode ? "text-[#9ca3af]" : "text-gray-600"
                )}>
                  {channel.ultimaAtividade} • {channel.status}
                </div>
              </div>
              {/* Pin sempre visível */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(channel.id);
                }}
                className={cn(
                  "p-1 rounded-md ml-2 transition-colors",
                  isDarkMode ? "hover:bg-[#27272a]" : "hover:bg-gray-200"
                )}
                title={channelIsPinned ? "Desafixar canal" : "Fixar canal"}
              >
                <Pin 
                  size={20}
                  className={cn(
                    channelIsPinned ? "text-[#b5103c] fill-current" : (isDarkMode ? "text-gray-400" : "text-gray-600")
                  )}
                />
              </button>
            </div>

            {/* Badge de conversas não lidas */}
            {channel.conversasNaoLidas > 0 && (
              <div className={cn(
                "absolute top-2 right-2 bg-[#b5103c] text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center font-bold px-1"
              )}>
                {channel.conversasNaoLidas > 99 ? '99+' : channel.conversasNaoLidas}
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
};
