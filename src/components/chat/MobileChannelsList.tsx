
import React from 'react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useChannels } from '@/contexts/ChannelContext';
import { useSimpleConversationsWithRealtime } from '@/hooks/useSimpleConversationsWithRealtime';
import { Badge } from '@/components/ui/badge';
import { Hash, Users, Store, ExternalLink, UserCheck } from 'lucide-react';

interface MobileChannelsListProps {
  isDarkMode: boolean;
  onChannelSelect: (channelId: string) => void;
}

export const MobileChannelsList: React.FC<MobileChannelsListProps> = ({
  isDarkMode,
  onChannelSelect
}) => {
  const { getAccessibleChannels } = usePermissions();
  const { channels } = useChannels();

  // Mapear canais para o formato usado pelo chat
  const getChannelMapping = () => {
    const mapping: Record<string, string> = {};
    channels.forEach(channel => {
      if (channel.name === 'Yelena-AI') mapping['chat'] = channel.id;
      else if (channel.name === 'Canarana') mapping['canarana'] = channel.id;
      else if (channel.name === 'Souto Soares') mapping['souto-soares'] = channel.id;
      else if (channel.name === 'João Dourado') mapping['joao-dourado'] = channel.id;
      else if (channel.name === 'América Dourada') mapping['america-dourada'] = channel.id;
      else if (channel.name === 'Gerente das Lojas') mapping['gerente-lojas'] = channel.id;
      else if (channel.name === 'Gerente do Externo') mapping['gerente-externo'] = channel.id;
      else if (channel.name === 'Pedro') mapping['pedro'] = channel.id;
    });
    return mapping;
  };

  // Canais baseados nas permissões do usuário
  const getUserChannels = () => {
    const channelMapping = getChannelMapping();
    const accessibleChannels = getAccessibleChannels();
    
    return channels
      .filter(channel => channel.isActive)
      .map(channel => {
        const legacyId = Object.keys(channelMapping).find(key => channelMapping[key] === channel.id) || channel.id;
        return {
          id: legacyId,
          realId: channel.id,
          name: channel.name,
          type: channel.type
        };
      })
      .filter(channel => accessibleChannels.includes(channel.id));
  };

  const availableChannels = getUserChannels();

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'general':
        return <Hash size={20} className="text-blue-500" />;
      case 'store':
        return <Store size={20} className="text-green-500" />;
      case 'department':
        return <Users size={20} className="text-purple-500" />;
      case 'external':
        return <ExternalLink size={20} className="text-orange-500" />;
      case 'manager':
        return <UserCheck size={20} className="text-red-500" />;
      default:
        return <Hash size={20} className="text-gray-500" />;
    }
  };

  const ChannelWithStats: React.FC<{ channel: any }> = ({ channel }) => {
    const { conversations, loading } = useSimpleConversationsWithRealtime(channel.realId);
    
    const unreadCount = conversations.reduce((total, conv) => {
      return total + (conv.unread_count || 0);
    }, 0);

    return (
      <div
        onClick={() => onChannelSelect(channel.id)}
        className={cn(
          "p-4 border-b cursor-pointer transition-colors",
          isDarkMode ? "border-zinc-800 hover:bg-zinc-900" : "border-gray-200 hover:bg-gray-50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              isDarkMode ? "bg-zinc-800" : "bg-gray-100"
            )}>
              {getChannelIcon(channel.type)}
            </div>
            <div>
              <h3 className={cn(
                "font-medium",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {channel.name}
              </h3>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-zinc-400" : "text-gray-600"
              )}>
                {loading ? 'Carregando...' : `${conversations.length} conversas`}
              </p>
            </div>
          </div>
          
          {!loading && unreadCount > 0 && (
            <Badge 
              variant="default" 
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isDarkMode ? "bg-zinc-950" : "bg-white"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b",
        isDarkMode ? "border-zinc-800" : "border-gray-200"
      )}>
        <h2 className={cn(
          "text-xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Canais
        </h2>
        <p className={cn(
          "text-sm mt-1",
          isDarkMode ? "text-zinc-400" : "text-gray-600"
        )}>
          Selecione um canal para ver as conversas
        </p>
      </div>

      {/* Lista de canais */}
      <div className="flex-1 overflow-y-auto">
        {availableChannels.length === 0 ? (
          <div className="p-8 text-center">
            <Hash size={48} className={cn(
              "mx-auto mb-4",
              isDarkMode ? "text-zinc-600" : "text-gray-400"
            )} />
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-zinc-400" : "text-gray-600"
            )}>
              Nenhum canal disponível
            </p>
          </div>
        ) : (
          availableChannels.map((channel) => (
            <ChannelWithStats 
              key={`mobile-channel-${channel.id}`} 
              channel={channel} 
            />
          ))
        )}
      </div>
    </div>
  );
};
