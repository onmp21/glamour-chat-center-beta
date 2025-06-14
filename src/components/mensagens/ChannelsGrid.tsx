import React from 'react';
import { cn } from '@/lib/utils';

interface ChannelsGridProps {
  channels: Array<{ id: string; nome: string; tipo: string; status: string; conversasNaoLidas: number; ultimaAtividade: string; }>;
  onChannelClick: (channelId: string) => void;
  isDarkMode: boolean;
}

export const ChannelsGrid: React.FC<ChannelsGridProps> = ({ channels, onChannelClick, isDarkMode }) => {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
      isDarkMode ? "text-white" : "text-gray-900"
    )}>
      {channels.map(channel => (
        <div
          key={channel.id}
          className={cn(
            "p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200",
            isDarkMode ? "bg-[#18181b] hover:bg-[#2a2a2e]" : "bg-white hover:bg-gray-100",
            "flex flex-col justify-between"
          )}
          onClick={() => {
            console.log(`📺 [CHANNELS_GRID] Clicking channel: ${channel.nome}, ID: ${channel.id}`);
            onChannelClick(channel.id);
          }}
        >
          <div>
            <h3 className="font-semibold text-lg">{channel.nome}</h3>
            <p className="text-sm text-gray-500">{channel.tipo}</p>
          </div>
          <div className="mt-4 text-right text-sm text-gray-500">
            <p>{channel.status}</p>
            <p>{channel.ultimaAtividade}</p>
          </div>
        </div>
      ))}
    </div>
  );
};


