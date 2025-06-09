
import React from 'react';
import { cn } from '@/lib/utils';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useChannelConversationCounts } from '@/hooks/useChannelConversationCounts';
import { MessageCircle, Hash, Users, Phone } from 'lucide-react';

interface ChannelsSectionProps {
  isDarkMode: boolean;
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
}

export const ChannelsSection: React.FC<ChannelsSectionProps> = ({
  isDarkMode,
  activeChannel,
  onChannelSelect
}) => {
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  const getChannelLegacyId = (channel: any) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gustavo Gerente das Lojas': 'gerente-lojas',
      'Andressa Gerente Externo': 'gerente-externo'
    };
    return nameToId[channel.name] || channel.id;
  };

  const getChannelDisplayName = (channelName: string) => {
    const nameMappings: Record<string, string> = {
      'Yelena-AI': 'Óticas Villa Glamour',
      'Gerente das Lojas': 'Gustavo Gerente das Lojas',
      'Gerente do Externo': 'Andressa Gerente Externo'
    };
    return nameMappings[channelName] || channelName;
  };

  const accessibleChannels = getAccessibleChannels();
  const availableChannels = channels
    .filter(channel => channel.isActive)
    .map(channel => ({
      ...channel,
      legacyId: getChannelLegacyId(channel),
      displayName: getChannelDisplayName(channel.name)
    }))
    .filter(channel => accessibleChannels.includes(channel.legacyId));

  const getChannelIcon = (channelName: string) => {
    if (channelName.includes('Yelena') || channelName.includes('AI')) {
      return MessageCircle;
    }
    if (channelName.includes('Canarana') || channelName.includes('Souto') || channelName.includes('João') || channelName.includes('América')) {
      return Hash;
    }
    if (channelName.includes('Gustavo')) {
      return Users;
    }
    if (channelName.includes('Andressa')) {
      return Phone;
    }
    return MessageCircle;
  };

  const ChannelItem: React.FC<{ channel: any }> = ({ channel }) => {
    const IconComponent = getChannelIcon(channel.name);
    const isActive = activeChannel === channel.legacyId;
    const { counts } = useChannelConversationCounts(channel.legacyId);
    
    return (
      <button 
        onClick={() => onChannelSelect(channel.legacyId)} 
        className={cn(
          "w-full p-4 rounded-xl transition-all duration-300 text-left flex items-center space-x-4 hover:scale-[1.02]",
          isActive 
            ? "bg-[#b5103c] text-white shadow-lg" 
            : isDarkMode 
              ? "bg-[#18181b] border-2 border-[#3f3f46] hover:border-[#b5103c]/50 hover:bg-[#27272a]" 
              : "bg-white border-2 border-gray-200 hover:border-[#b5103c]/50 hover:bg-gray-50"
        )}
      >
        <div className={cn(
          "p-3 rounded-lg",
          isActive 
            ? "bg-white/20" 
            : isDarkMode 
              ? "bg-[#27272a]" 
              : "bg-gray-100"
        )}>
          <IconComponent 
            size={20} 
            className={isActive ? "text-white" : "text-[#b5103c]"} 
            strokeWidth={1.5} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-semibold text-base truncate",
              isActive 
                ? "text-white" 
                : isDarkMode 
                  ? "text-[#fafafa]" 
                  : "text-gray-900"
            )}>
              {channel.displayName}
            </h3>
            
            {counts.total > 0 && (
              <span className={cn(
                "text-xs px-2 py-1 rounded-full ml-2",
                isActive 
                  ? "bg-white/20 text-white" 
                  : "bg-[#b5103c] text-white"
              )}>
                {counts.total}
              </span>
            )}
          </div>
          
          <p className={cn(
            "text-sm",
            isActive 
              ? "text-white/80" 
              : isDarkMode 
                ? "text-[#a1a1aa]" 
                : "text-gray-600"
          )}>
            {counts.total > 0 ? `${counts.pending} pendentes, ${counts.inProgress} em andamento` : 'Canal de atendimento'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      <div className="flex-1 p-6 space-y-3 overflow-y-auto my-[12px] py-[40px] px-[33px] mx-0">
        {availableChannels.map(channel => (
          <ChannelItem key={channel.id} channel={channel} />
        ))}
        
        {availableChannels.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle 
              size={48} 
              className={cn(
                "mx-auto mb-4",
                isDarkMode ? "text-[#3f3f46]" : "text-gray-300"
              )} 
              strokeWidth={1.5} 
            />
            <p className={cn(
              "text-lg font-medium",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
            )}>
              Nenhum canal disponível
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
