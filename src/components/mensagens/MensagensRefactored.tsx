import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { MessagesHeader } from './MessagesHeader';
import { SectionTabs } from './SectionTabs';
import { ChannelsGrid } from './ChannelsGrid';
import { ContactsListOptimized } from './ContactsListOptimized';
import { NewContactModal } from './NewContactModal';
import { ChannelSelectorModal } from './ChannelSelectorModal';
import { ChatOverlayRefactored } from './chat/ChatOverlayRefactored';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useInternalChannels } from '@/hooks/useInternalChannels';
import { useAuth } from '@/contexts/AuthContext';

interface MensagensRefactoredProps {
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
  initialChannel?: string | null;
  initialPhone?: string | null;
}

export const MensagensRefactored: React.FC<MensagensRefactoredProps> = ({ 
  isDarkMode, 
  onSectionChange,
  initialChannel = null,
  initialPhone = null
}) => {
  const [activeTab, setActiveTab] = useState<'canais' | 'contatos'>('canais');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isChannelSelectorOpen, setIsChannelSelectorOpen] = useState(false);
  const [selectedContactChannels, setSelectedContactChannels] = useState<string[]>([]);
  const [selectedContactName, setSelectedContactName] = useState('');

  const { channels: internalChannels } = useInternalChannels(); // InternalChannel[], cada um tem .legacyId
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth(); // ✅ Use hook properly

  // Montar lista de canais baseada no role:
  let canaisData = [];
  if (user?.role === 'admin') {
    // Admin pode ver todos os ativos, exceto Pedro
    canaisData = internalChannels
      .filter(channel =>
        channel.isActive &&
        channel.name &&
        channel.name.toLowerCase() !== 'pedro'
      )
      .map(channel => ({
        id: channel.legacyId,
        nome: channel.name,
        tipo: channel.type === 'general' ? 'IA Assistant' :
              channel.type === 'store' ? 'Loja' :
              channel.type === 'manager' ? 'Gerente' : 'Canal',
        status: 'ativo' as const,
        conversasNaoLidas: 0,
        ultimaAtividade: 'Online'
      }));
  } else {
    // Usuário comum
    const accessibleChannels = getAccessibleChannels();
    canaisData = internalChannels
      .filter(channel =>
        channel.isActive &&
        channel.name &&
        channel.name.toLowerCase() !== 'pedro' &&
        accessibleChannels.includes(channel.legacyId)
      )
      .map(channel => ({
        id: channel.legacyId,
        nome: channel.name,
        tipo: channel.type === 'general' ? 'IA Assistant' :
              channel.type === 'store' ? 'Loja' :
              channel.type === 'manager' ? 'Gerente' : 'Canal',
        status: 'ativo' as const,
        conversasNaoLidas: 0,
        ultimaAtividade: 'Online'
      }));
  }

  useEffect(() => {
    console.log('🔍 [MENSAGENS] Initial params detected:', { channel: initialChannel, phone: initialPhone });
    
    if (initialChannel && initialPhone) {
      const mappedInitialChannel = initialChannel; // Mapear o initialChannel
      console.log('🚀 [MENSAGENS] Opening ChatOverlay for channel (mapped initialChannel):', mappedInitialChannel);
      setSelectedChannel(mappedInitialChannel);
    }
  }, [initialChannel, initialPhone]);

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('File sending handled by ChatOverlayRefactored');
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('Audio sending handled by ChatOverlayRefactored');
  };

  const handleChannelClick = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  const handleCloseOverlay = () => {
    setSelectedChannel(null);
    const newUrl = "/?section=mensagens";
    window.history.replaceState({}, "", newUrl);
  };

  if (selectedChannel) {
    return (
      <ChatOverlayRefactored
        channelId={selectedChannel}
        isDarkMode={isDarkMode}
        onClose={handleCloseOverlay}
        onSendFile={handleSendFile}
        onSendAudio={handleSendAudio}
      />
    );
  }

  return (
    <div className={cn(
      "flex-1 p-6 space-y-6 overflow-auto",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      <MessagesHeader isDarkMode={isDarkMode} />

      <SectionTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
      />

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder={
              activeTab === 'canais' 
                ? "Buscar canais..." 
                : "Buscar contatos ou números..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-10",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}
          />
        </div>
        {activeTab === 'contatos' && (
          <Button 
            onClick={() => setIsNewContactModalOpen(true)}
            className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
          >
            <Plus size={16} className="mr-2" />
            Novo Contato
          </Button>
        )}
      </div>

      {activeTab === 'canais' ? (
        <ChannelsGrid
          channels={canaisData}
          onChannelClick={handleChannelClick}
          isDarkMode={isDarkMode}
        />
      ) : (
        <ContactsListOptimized
          contacts={[]}
          onContactClick={() => {}}
          isDarkMode={isDarkMode}
        />
      )}

      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onSubmit={() => {}}
        isDarkMode={isDarkMode}
      />

      <ChannelSelectorModal
        isOpen={isChannelSelectorOpen}
        onClose={() => setIsChannelSelectorOpen(false)}
        onChannelSelect={() => {}}
        contactName={selectedContactName}
        availableChannels={selectedContactChannels}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
