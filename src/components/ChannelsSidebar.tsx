
import React from 'react';
import { cn } from '@/lib/utils';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { MessageCircle, Hash, Users, Phone } from 'lucide-react';

interface ChannelsSidebarProps {
  isDarkMode: boolean;
  activeSection: string;
  onChannelSelect: (channelId: string) => void;
}

export const ChannelsSidebar: React.FC<ChannelsSidebarProps> = ({
  isDarkMode,
  activeSection,
  onChannelSelect
}) => {
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  // Mapear canais do banco para IDs legados para compatibilidade
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

  // Função para obter nome de exibição do canal com mapeamentos
  const getChannelDisplayName = (channelName: string) => {
    const nameMappings: Record<string, string> = {
      'Andressa Gerente Externo': 'Andressa',
      'Gustavo Gerente das Lojas': 'Gustavo',
      'Yelena-AI': 'Óticas Villa Glamour'
    };
    return nameMappings[channelName] || channelName;
  };

  const accessibleChannels = getAccessibleChannels();
  const availableChannels = channels
    .filter(channel => 
      channel.isActive && 
      channel.name !== 'Pedro' && // Filtrar o canal Pedro que não existe mais
      channel.name // Garantir que o canal tem um nome válido
    )
    .map(channel => ({
      ...channel,
      legacyId: getChannelLegacyId(channel),
      displayName: getChannelDisplayName(channel.name)
    }))
    .filter(channel => accessibleChannels.includes(channel.legacyId));

  const handleChannelClick = (channelId: string) => {
    onChannelSelect(channelId);
  };

  // Função para obter ícone do canal
  const getChannelIcon = (channelName: string) => {
    if (channelName.includes('Yelena') || channelName.includes('AI') || channelName.includes('Óticas')) {
      return MessageCircle;
    }
    if (channelName.includes('Canarana') || channelName.includes('Souto') || channelName.includes('João') || channelName.includes('América')) {
      return Hash;
    }
    if (channelName.includes('Gustavo') || channelName.includes('Lojas')) {
      return Users;
    }
    if (channelName.includes('Andressa') || channelName.includes('Externo')) {
      return Phone;
    }
    return MessageCircle;
  };

  return (
    <div className={cn("h-full flex flex-col", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      {/* Header alinhado à esquerda */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-[#b5103c]/10">
            <MessageCircle size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Canais de Atendimento
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              {availableChannels.length} canais disponíveis
            </p>
          </div>
        </div>
      </div>

      {/* Lista de canais vertical simples */}
      <div className="flex-1 p-6 pt-0 space-y-3">
        {availableChannels.map(channel => {
          const IconComponent = getChannelIcon(channel.displayName);
          const isActive = activeSection === channel.legacyId;
          
          return (
            <button 
              key={channel.id}
              onClick={() => handleChannelClick(channel.legacyId)} 
              className={cn(
                "w-full p-4 rounded-lg transition-all duration-200 text-left flex items-center space-x-3",
                isActive 
                  ? "bg-[#b5103c] text-white shadow-lg" 
                  : isDarkMode 
                    ? "bg-[#18181b] border border-[#3f3f46] hover:border-[#b5103c]/50 hover:bg-[#27272a]" 
                    : "bg-white border border-gray-200 hover:border-[#b5103c]/50 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                isActive 
                  ? "bg-white/20" 
                  : isDarkMode 
                    ? "bg-[#27272a]" 
                    : "bg-gray-100"
              )}>
                <IconComponent 
                  size={18} 
                  className={isActive ? "text-white" : "text-[#b5103c]"} 
                  strokeWidth={1.5} 
                />
              </div>
              
              <div className="flex-1 min-w-0">
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
                
                <p className={cn(
                  "text-sm",
                  isActive 
                    ? "text-white/80" 
                    : isDarkMode 
                      ? "text-[#a1a1aa]" 
                      : "text-gray-600"
                )}>
                  Canal ativo
                </p>
              </div>
              
              <div className={cn(
                "w-2 h-2 rounded-full",
                "bg-green-500"
              )} />
            </button>
          );
        })}
        
        {availableChannels.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle 
              size={48} 
              className={cn(
                "mx-auto mb-4",
                isDarkMode ? "text-[#3f3f46]" : "text-gray-300"
              )} 
              strokeWidth={1.5} 
            />
            <h3 className={cn(
              "text-lg font-medium mb-2",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
            )}>
              Nenhum canal disponível
            </h3>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-[#71717a]" : "text-gray-400"
            )}>
              Entre em contato com o administrador
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
