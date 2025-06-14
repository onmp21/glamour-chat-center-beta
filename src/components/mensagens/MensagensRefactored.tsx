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

  const { channels } = useChannels();
  console.log("📊 [MENSAGENS_REFACTORED] Canais brutos do useChannels():", channels);
  const { getAccessibleChannels } = usePermissions();

  useEffect(() => {
    console.log('🔍 [MENSAGENS] Initial params detected:', { channel: initialChannel, phone: initialPhone });
    
    if (initialChannel && initialPhone) {
      const mappedInitialChannel = getChannelLegacyId({ name: initialChannel, id: initialChannel }); // Mapear o initialChannel
      console.log('🚀 [MENSAGENS] Opening ChatOverlay for channel (mapped initialChannel):', mappedInitialChannel);
      setSelectedChannel(mappedInitialChannel);
    }
  }, [initialChannel, initialPhone]);

  const getChannelLegacyId = (channel: any) => {
    // Mapear nomes de canais para UUIDs do Supabase
    const nameToId: Record<string, string> = {
      'yelena-ai': 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6',
      'chat': 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6',
      'canarana': '011b69ba-cf25-4f63-af2e-4ad0260d9516',
      'souto soares': 'b7996f75-41a7-4725-8229-564f31868027',
      'joão dourado': '621abb21-60b2-4ff2-a0a6-172a94b4b65c',
      'américa dourada': '64d8acad-c645-4544-a1e6-2f0825fae00b',
      'gustavo gerente das lojas': 'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce',
      'andressa gerente externo': 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7'
    };
    
    // Converter o nome do canal para uma chave padronizada (ex: tudo minúsculo)
    const normalizedChannelName = channel.name.toLowerCase();

    // Primeiro tentar mapear pelo nome normalizado
    console.log(`🔄 [CHANNEL_MAPPING] getChannelLegacyId received channel.name: "${channel.name}", normalized: "${normalizedChannelName}"`);
    const mappedId = nameToId[normalizedChannelName];
    if (mappedId) {
      console.log(`🔄 [CHANNEL_MAPPING] Mapped ${channel.name} to UUID: ${mappedId}`);
      return mappedId;
    }
    
    // Se não encontrar, usar o ID original
    console.log(`🔄 [CHANNEL_MAPPING] Using original ID for ${channel.name}: ${channel.id}`);
    return channel.id;
  };

  const accessibleChannels = getAccessibleChannels();
  const canaisData = channels
    .filter(channel => 
      channel.isActive && // Corrigido de is_active para isActive
      channel.name !== 'Pedro' &&
      channel.name
    )
<<<<<<< HEAD
      .map(channel => {
      console.log(`🔍 [MENSAGENS_REFACTORED] Processing channel name: "${channel.name}", original ID: "${channel.id}"`);
      return {
        id: getChannelLegacyId(channel),
        nome: channel.name,
        tipo: channel.type === 'general' ? 'IA Assistant' :
              channel.type === 'store' ? 'Loja' :
              channel.type === 'manager' ? 'Gerente' : 'Canal',
        status: 'ativo' as const,
        conversasNaoLidas: 0,
        ultimaAtividade: 'Online'
      };
    })
    .filter(channel => accessibleChannels.includes(channel.id));

  console.log("📊 [MENSAGENS_REFACTORED] canaisData gerado:", canaisData);

=======
    .map(channel => ({
      id: getChannelLegacyId(channel),
      nome: channel.name,
      tipo: channel.type === 'general' ? 'IA Assistant' : 
            channel.type === 'store' ? 'Loja' : 
            channel.type === 'manager' ? 'Gerente' : 'Canal',
      status: 'ativo' as const,
      conversasNaoLidas: 0,
      ultimaAtividade: 'Online'
    }))
    .filter(channel => accessibleChannels.includes(channel.id));

>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0
  const handleSendFile = async (file: File, caption?: string) => {
    console.log('File sending handled by ChatOverlayRefactored');
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('Audio sending handled by ChatOverlayRefactored');
  };

  const handleChannelClick = (channelId: string) => {
    console.log("📺 [MENSAGENS] Channel clicked (raw channelId):", channelId);
    setSelectedChannel(channelId);
    console.log("📺 [MENSAGENS] selectedChannel updated to (after click):", channelId);
  };

  const handleCloseOverlay = () => {
    console.log("❌ [MENSAGENS] Closing chat overlay");
    setSelectedChannel(null);
    console.log("❌ [MENSAGENS] selectedChannel set to null.");
    
    const newUrl = "/?section=mensagens";
    window.history.replaceState({}, "", newUrl);
  };

<<<<<<< HEAD
  console.log("Current selectedChannel in MensagensRefactored (before render):", selectedChannel);
=======
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0
  if (selectedChannel) {
    console.log("Rendering ChatOverlayRefactored for channel:", selectedChannel);
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
