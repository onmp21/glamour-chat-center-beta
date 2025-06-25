
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { MessagesHeader } from './MessagesHeader';
import { SectionTabs } from './SectionTabs';
import { ChannelsSection } from '@/components/dashboard/ChannelsSection';
import { ContactsListOptimized } from './ContactsListOptimized';
import { NewContactModal } from './NewContactModal';
import { ChannelSelectorModal } from './ChannelSelectorModal';
import { ChatOverlayRefactored } from './chat/ChatOverlayRefactored';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useInternalChannels } from '@/hooks/useInternalChannels';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MensagensRefactoredProps {
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
  initialChannel?: string | null;
  initialPhone?: string | null;
}

export const MensagensRefactored: React.FC<MensagensRefactoredProps> = React.memo(({ 
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

  const { channels: internalChannels } = useInternalChannels();
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();

  // Tratar parâmetros iniciais apenas uma vez
  useEffect(() => {
    if (initialChannel && initialPhone) {
      console.log('🔍 [MENSAGENS] Opening channel from URL:', initialChannel);
      setSelectedChannel(initialChannel);
    }
  }, [initialChannel, initialPhone]);

  // Callbacks otimizados com useCallback
  const handleSendFile = useCallback(async (file: File, caption?: string) => {
    console.log('📎 [MENSAGENS] File sending handled by ChatOverlayRefactored');
  }, []);

  const handleSendAudio = useCallback(async (audioBlob: Blob, duration: number) => {
    console.log('🎵 [MENSAGENS] Audio sending handled by ChatOverlayRefactored');
  }, []);

  const handleChannelClick = useCallback((channelId: string) => {
    console.log('📱 [MENSAGENS] Channel selected:', channelId);
    setSelectedChannel(channelId);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    console.log('❌ [MENSAGENS] Closing chat overlay');
    setSelectedChannel(null);
    const newUrl = "/?section=mensagens";
    window.history.replaceState({}, "", newUrl);
  }, []);

  const handleNewContact = useCallback((contactData: { nome: string; telefone: string; canal: string }) => {
    console.log('🆕 [NEW_CONTACT] Creating contact:', contactData);
    
    toast({
      title: "Contato Criado",
      description: `Contato ${contactData.nome} criado com sucesso. Aguardando primeira mensagem.`,
    });
    
    setSelectedChannel(contactData.canal);
  }, [toast]);

  const handleContactClick = useCallback((contact: any) => {
    console.log('👤 [CONTACT_CLICK] Contact selected:', contact);
    
    if (contact.canais && contact.canais.length === 1) {
      setSelectedChannel(contact.canais[0]);
    } else if (contact.canais && contact.canais.length > 1) {
      setSelectedContactChannels(contact.canais);
      setSelectedContactName(contact.nome);
      setIsChannelSelectorOpen(true);
    } else {
      // Pegar primeiro canal disponível se o contato não tem canais específicos
      if (internalChannels.length > 0) {
        const firstChannel = internalChannels.find(ch => ch.isActive && ch.name !== 'Pedro');
        if (firstChannel) {
          const nameToId: Record<string, string> = {
            'Yelena-AI': 'chat',
            'Canarana': 'canarana',
            'Souto Soares': 'souto-soares',
            'João Dourado': 'joao-dourado',
            'América Dourada': 'america-dourada',
            'Gerente das Lojas': 'gerente-lojas',
            'Andressa Gerente Externo': 'gerente-externo'
          };
          const legacyId = nameToId[firstChannel.name] || firstChannel.id;
          setSelectedChannel(legacyId);
        }
      }
    }
  }, [internalChannels]);

  const handleChannelSelect = useCallback((channelId: string) => {
    setSelectedChannel(channelId);
    setIsChannelSelectorOpen(false);
  }, []);

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
        <ChannelsSection
          isDarkMode={isDarkMode}
          onChannelClick={handleChannelClick}
          showHeader={false}
        />
      ) : (
        <ContactsListOptimized
          onContactClick={handleContactClick}
          isDarkMode={isDarkMode}
        />
      )}

      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onSubmit={handleNewContact}
        isDarkMode={isDarkMode}
      />

      <ChannelSelectorModal
        isOpen={isChannelSelectorOpen}
        onClose={() => setIsChannelSelectorOpen(false)}
        onChannelSelect={handleChannelSelect}
        contactName={selectedContactName}
        availableChannels={selectedContactChannels}
        isDarkMode={isDarkMode}
      />
    </div>
  );
});

MensagensRefactored.displayName = 'MensagensRefactored';
