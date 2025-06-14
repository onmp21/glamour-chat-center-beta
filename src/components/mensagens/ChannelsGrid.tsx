
import React from 'react';
import { cn } from '@/lib/utils';
import { ChannelCard } from '@/components/dashboard/ChannelCard';

interface Channel {
  id: string; // sempre será o legacyId (conforme convertido na MensagensRefactored)
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
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channelId={channel.id}
          name={channel.nome}
          type={channel.tipo}
          isDarkMode={isDarkMode}
          onClick={() => onChannelClick(channel.id)}
        />
      ))}
    </div>
  );
};

