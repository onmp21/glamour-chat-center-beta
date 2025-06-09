import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MobileChannelsList } from './chat/MobileChannelsList';
import { MobileConversationsList } from './chat/MobileConversationsList';
import { MobileChatView } from './chat/MobileChatView';
import { UnifiedSettings } from './UnifiedSettings';
import { WhatsAppChat } from './chat/WhatsAppChat';
import { ChatOverlay } from './mensagens/ChatOverlay';

interface ChatInterfaceProps {
  isDarkMode: boolean;
  activeChannel: string;
  showMobileSettings?: boolean;
  onCloseMobileSettings?: () => void;
  toggleDarkMode?: () => void;
  onToggleSidebar?: () => void;
  initialConversationId?: string | null;
  initialChannel?: string | null;
  initialPhone?: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isDarkMode,
  activeChannel,
  showMobileSettings = false,
  onCloseMobileSettings,
  toggleDarkMode = () => {},
  onToggleSidebar,
  initialConversationId = null,
  initialChannel = null,
  initialPhone = null
}) => {
  const { user } = useAuth();
  const [mobileView, setMobileView] = useState<'channels' | 'conversations' | 'chat' | 'settings'>('channels');
  const [mobileChannelId, setMobileChannelId] = useState<string | null>(null);
  const [mobileConversationId, setMobileConversationId] = useState<string | null>(null);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [overlayChannelId, setOverlayChannelId] = useState<string | null>(null);

  // Detectar parâmetros iniciais para abrir ChatOverlay automaticamente
  useEffect(() => {
    console.log('🔍 [CHAT_INTERFACE] Initial params detected:', { channel: initialChannel, phone: initialPhone });
    
    if (initialChannel && initialPhone) {
      console.log('🚀 [CHAT_INTERFACE] Opening ChatOverlay for channel:', initialChannel);
      setOverlayChannelId(initialChannel);
      setShowChatOverlay(true);
    }
  }, [initialChannel, initialPhone]);

  // Controlar exibição das configurações mobile
  useEffect(() => {
    if (showMobileSettings) {
      setMobileView('settings');
    } else if (activeChannel === 'channels') {
      setMobileView('channels');
    } else {
      // Se chegou diretamente em um canal específico, pular para conversas
      setMobileChannelId(activeChannel);
      // Se houver um ID inicial, ir direto para o chat
      if (initialConversationId) {
        setMobileConversationId(initialConversationId);
        setMobileView('chat');
      } else {
        setMobileView('conversations');
      }
    }
  }, [showMobileSettings, activeChannel, initialConversationId]);

  const handleMobileChannelSelect = (channelId: string) => {
    setMobileChannelId(channelId);
    setMobileView('conversations');
  };

  const handleMobileConversationSelect = (conversationId: string) => {
    setMobileConversationId(conversationId);
    setMobileView('chat');
  };

  const handleBackFromSettings = () => {
    setMobileView('channels');
    if (onCloseMobileSettings) {
      onCloseMobileSettings();
    }
  };

  const handleCloseChatOverlay = () => {
    console.log('🔒 [CHAT_INTERFACE] Closing ChatOverlay');
    setShowChatOverlay(false);
    setOverlayChannelId(null);
    
    // Limpar parâmetros da URL mantendo a seção
    const newUrl = '/?section=mensagens';
    window.history.replaceState({}, '', newUrl);
  };

  return (
    <div className={cn(
      "relative h-screen w-full",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* MOBILE: apenas mobile */}
      <div className="md:hidden w-full h-full absolute top-0 left-0 bg-inherit">
        {mobileView === 'settings' && (
          <UnifiedSettings
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            isMobile={true}
          />
        )}

        {mobileView === 'channels' && !showMobileSettings && (
          <MobileChannelsList
            isDarkMode={isDarkMode}
            onChannelSelect={handleMobileChannelSelect}
          />
        )}

        {mobileView === 'conversations' && (
          <MobileConversationsList
            isDarkMode={isDarkMode}
            mobileChannelId={mobileChannelId}
            onBack={() => setMobileView('channels')}
            onConversationSelect={handleMobileConversationSelect}
          />
        )}

        {mobileView === 'chat' && (
          <MobileChatView
            isDarkMode={isDarkMode}
            mobileConversationId={mobileConversationId}
            onBack={() => setMobileView('conversations')}
            channelId={mobileChannelId}
          />
        )}
      </div>

      {/* DESKTOP/WEB: Interface estilo WhatsApp com cores padronizadas */}
      <div className="hidden md:flex h-full w-full">
        <WhatsAppChat
          isDarkMode={isDarkMode}
          channelId={activeChannel}
          onToggleSidebar={onToggleSidebar}
          initialConversationId={initialConversationId}
        />
      </div>

      {/* ChatOverlay - Aberto quando há parâmetros de canal e telefone */}
      {showChatOverlay && overlayChannelId && (
        <ChatOverlay
          channelId={overlayChannelId}
          isDarkMode={isDarkMode}
          onClose={handleCloseChatOverlay}
        />
      )}
    </div>
  );
};
