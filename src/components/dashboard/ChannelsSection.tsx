import React from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { useAuth } from '@/contexts/AuthContext'; // Importação correta

interface ChannelsSectionProps {
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
}

export const ChannelsSection: React.FC<ChannelsSectionProps> = ({ 
  isDarkMode, 
  onChannelClick 
}) => {
  const { channels, loading } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth(); // hook no contexto React

  const getChannelLegacyId = (channel: any) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Óticas Villa Glamour': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gerente das Lojas': 'gerente-lojas', // CORRETO
      'Andressa Gerente Externo': 'gerente-externo'
    };
    return nameToId[channel.name] || channel.id;
  };

  const getChannelDisplayName = (channel: any) => {
    const nameMappings: Record<string, string> = {
      'Andressa Gerente Externo': 'Andressa',
      'Gerente das Lojas': 'Gustavo', // Mostra "Gustavo" para o usuário
      'Yelena-AI': 'Óticas Villa Glamour'
    };
    return nameMappings[channel.name] || channel.name;
  };

  const accessibleChannels = getAccessibleChannels();
  let availableChannels = [];

  if (user?.role === 'admin') {
    availableChannels = channels
      .filter(channel => channel.isActive && channel.name !== 'Pedro')
      .map(channel => ({
        ...channel,
        legacyId: getChannelLegacyId(channel),
        displayName: getChannelDisplayName(channel)
      }));
  } else {
    availableChannels = channels
      .filter(channel => 
        channel.isActive && 
        channel.name !== 'Pedro' &&
        accessibleChannels.includes(getChannelLegacyId(channel))
      )
      .map(channel => ({
        ...channel,
        legacyId: getChannelLegacyId(channel),
        displayName: getChannelDisplayName(channel)
      }));
  }

  const handleChannelClick = (channelId: string) => {
    console.log('🔥 Dashboard channel clicked:', channelId);
    onChannelClick(channelId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={cn(
            "h-24 rounded-xl animate-pulse",
            isDarkMode ? "bg-[#18181b]" : "bg-white"
          )} />
        ))}
      </div>
    );
  }

  return (
    <Card className={cn(
      "border-0 shadow-sm",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <CardHeader>
        <CardTitle className={cn(
          "text-xl flex items-center gap-3",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          <Folder className="text-[#b5103c]" size={24} />
          Canais de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channelId={channel.legacyId}
              name={channel.displayName}
              type="Canal de atendimento"
              isDarkMode={isDarkMode}
              onClick={handleChannelClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
