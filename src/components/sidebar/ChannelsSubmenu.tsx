
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, MessageSquare, Phone, Store, Building, Users } from 'lucide-react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';

interface ChannelsSubmenuProps {
  isDarkMode: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const ChannelsSubmenu: React.FC<ChannelsSubmenuProps> = ({
  isDarkMode,
  activeSection,
  onSectionChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  const getChannelIcon = (name: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Yelena': <MessageSquare className="w-4 h-4" />,
      'Canarana': <Store className="w-4 h-4" />,
      'Souto Soares': <Building className="w-4 h-4" />,
      'João Dourado': <Users className="w-4 h-4" />,
      'América Dourada': <Building className="w-4 h-4" />,
      'Gerente Lojas': <Store className="w-4 h-4" />,
      'Gerente Externo': <Users className="w-4 h-4" />
    };
    
    return iconMap[name] || <MessageSquare className="w-4 h-4" />;
  };

  const getChannelLegacyId = (channel: any) => {
    const nameToId: Record<string, string> = {
      'Yelena': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gerente das Lojas': 'gerente-lojas', // PADRONIZADO
      'Gerente Externo': 'gerente-externo'
    };
    return nameToId[channel.name] || channel.id;
  };

  const accessibleChannels = getAccessibleChannels();
  const availableChannels = channels
    .filter(channel => channel.isActive)
    .map(channel => ({
      ...channel,
      legacyId: getChannelLegacyId(channel)
    }))
    .filter(channel => accessibleChannels.includes(channel.legacyId));

  return (
    <div className="space-y-1">
      {/* Botão principal de Canais */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          onSectionChange('channels');
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          activeSection === 'channels' || activeSection.includes('chat') || activeSection.includes('canal')
            ? (isDarkMode 
                ? "bg-[#b5103c] text-white" 
                : "bg-[#b5103c] text-white")
            : (isDarkMode 
                ? "text-slate-300 hover:bg-slate-800 hover:text-white" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")
        )}
      >
        <div className="flex items-center">
          <MessageSquare className="mr-3 h-4 w-4" />
          <span>Canais</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Submenu de canais */}
      {isExpanded && (
        <div className="ml-4 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-4">
          {availableChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSectionChange(channel.legacyId)}
              className={cn(
                "w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                activeSection === channel.legacyId
                  ? (isDarkMode 
                      ? "bg-[#8a0c2e] text-white" 
                      : "bg-[#b5103c]/10 text-[#b5103c]")
                  : (isDarkMode 
                      ? "text-slate-400 hover:bg-slate-800 hover:text-white" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700")
              )}
            >
              {getChannelIcon(channel.name)}
              <span className="ml-2 truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
