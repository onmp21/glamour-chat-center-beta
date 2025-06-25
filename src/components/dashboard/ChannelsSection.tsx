
import React from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { useAuth } from '@/contexts/AuthContext';

interface ChannelsSectionProps {
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
  // Props opcionais para customização da aba mensagens
  showHeader?: boolean;
  headerTitle?: string;
  headerIcon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}

export const ChannelsSection: React.FC<ChannelsSectionProps> = ({ 
  isDarkMode, 
  onChannelClick,
  showHeader = true,
  headerTitle = "Canais de Atendimento",
  headerIcon: HeaderIcon = Folder,
  className
}) => {
  const { channels, loading } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth();

  const getChannelLegacyId = (channel: any) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Óticas Villa Glamour': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gerente das Lojas': 'gerente-lojas',
      'Andressa Gerente Externo': 'gerente-externo'
    };
    return nameToId[channel.name] || channel.id;
  };

  const getChannelDisplayName = (channel: any) => {
    const nameMappings: Record<string, string> = {
      'Andressa Gerente Externo': 'Andressa',
      'Gerente das Lojas': 'Gustavo',
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
    console.log('🔥 Channel clicked:', channelId);
    onChannelClick(channelId);
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={cn(
            "h-24 rounded-xl animate-pulse",
            isDarkMode ? "bg-[#18181b]" : "bg-white"
          )} />
        ))}
      </div>
    );
  }

  // Se não deve mostrar header, renderizar apenas o grid
  if (!showHeader) {
    if (availableChannels.length === 0) {
      return (
        <div className={cn(
          "w-full flex flex-col items-center justify-center",
          isDarkMode ? "bg-[#09090b] text-[#9ca3af] min-h-[240px]" : "bg-white text-gray-500 min-h-[240px]",
          className
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
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
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
    );
  }

  // Renderizar com header (comportamento original do dashboard)
  return (
    <Card className={cn(
      "border-0 shadow-sm",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200",
      className
    )}>
      <CardHeader>
        <CardTitle className={cn(
          "text-xl flex items-center gap-3",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          <HeaderIcon className="text-[#b5103c]" size={24} />
          {headerTitle}
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
