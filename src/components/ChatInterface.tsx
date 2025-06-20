import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MobileChannelsList } from './chat/MobileChannelsList';
import { MobileConversationsList } from './chat/MobileConversationsList';
import { MobileChatView } from './chat/MobileChatView';
import { UnifiedSettings } from './UnifiedSettings';
import { WhatsAppChat } from './chat/WhatsAppChat';
import { ChatOverlay } from './mensagens/ChatOverlay';

// Types
type MobileView = 'channels' | 'conversations' | 'chat' | 'settings';

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

interface MobileState {
  view: MobileView;
  channelId: string | null;
  conversationId: string | null;
}

interface OverlayState {
  isVisible: boolean;
  channelId: string | null;
}

// Custom Hooks
const useMobileNavigation = (
  activeChannel: string,
  showMobileSettings: boolean,
  initialConversationId: string | null,
  onCloseMobileSettings?: () => void
) => {
  const [mobileState, setMobileState] = useState<MobileState>({
    view: 'channels',
    channelId: null,
    conversationId: null
  });

  // Handle mobile view changes based on props
  useEffect(() => {
    if (showMobileSettings) {
      setMobileState(prev => ({ ...prev, view: 'settings' }));
    } else if (activeChannel === 'channels') {
      setMobileState(prev => ({ ...prev, view: 'channels' }));
    } else {
      // Navigate to specific channel
      setMobileState(prev => ({
        ...prev,
        channelId: activeChannel,
        view: initialConversationId ? 'chat' : 'conversations',
        conversationId: initialConversationId
      }));
    }
  }, [showMobileSettings, activeChannel, initialConversationId]);

  const navigateToChannels = () => {
    setMobileState(prev => ({ ...prev, view: 'channels' }));
    onCloseMobileSettings?.();
  };

  const navigateToConversations = (channelId: string) => {
    setMobileState(prev => ({
      ...prev,
      channelId,
      view: 'conversations'
    }));
  };

  const navigateToChat = (conversationId: string) => {
    setMobileState(prev => ({
      ...prev,
      conversationId,
      view: 'chat'
    }));
  };

  const navigateBack = () => {
    switch (mobileState.view) {
      case 'settings':
        navigateToChannels();
        break;
      case 'conversations':
        setMobileState(prev => ({ ...prev, view: 'channels' }));
        break;
      case 'chat':
        setMobileState(prev => ({ ...prev, view: 'conversations' }));
        break;
    }
  };

  return {
    mobileState,
    navigateToChannels,
    navigateToConversations,
    navigateToChat,
    navigateBack
  };
};

const useChatOverlay = (initialChannel: string | null, initialPhone: string | null) => {
  const [overlayState, setOverlayState] = useState<OverlayState>({
    isVisible: false,
    channelId: null
  });

  // Auto-open overlay when initial params are provided
  useEffect(() => {
    console.log('🔍 [CHAT_INTERFACE] Initial params detected:', { 
      channel: initialChannel, 
      phone: initialPhone 
    });
    
    if (initialChannel && initialPhone) {
      console.log('🚀 [CHAT_INTERFACE] Opening ChatOverlay for channel:', initialChannel);
      setOverlayState({
        isVisible: true,
        channelId: initialChannel
      });
    }
  }, [initialChannel, initialPhone]);

  const closeOverlay = () => {
    console.log('🔒 [CHAT_INTERFACE] Closing ChatOverlay');
    setOverlayState({
      isVisible: false,
      channelId: null
    });
    
    // Clear URL parameters while maintaining section
    const newUrl = '/?section=mensagens';
    window.history.replaceState({}, '', newUrl);
  };

  return {
    overlayState,
    closeOverlay
  };
};

// Components
const MobileInterface: React.FC<{
  isDarkMode: boolean;
  mobileState: MobileState;
  showMobileSettings: boolean;
  toggleDarkMode?: () => void;
  onChannelSelect: (channelId: string) => void;
  onConversationSelect: (conversationId: string) => void;
  onBack: () => void;
}> = ({
  isDarkMode,
  mobileState,
  showMobileSettings,
  toggleDarkMode,
  onChannelSelect,
  onConversationSelect,
  onBack
}) => {
  const renderMobileView = () => {
    switch (mobileState.view) {
      case 'settings':
        return (
          <UnifiedSettings
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            isMobile={true}
          />
        );

      case 'channels':
        if (!showMobileSettings) {
          return (
            <MobileChannelsList
              isDarkMode={isDarkMode}
              onChannelSelect={onChannelSelect}
            />
          );
        }
        return null;

      case 'conversations':
        return (
          <MobileConversationsList
            isDarkMode={isDarkMode}
            mobileChannelId={mobileState.channelId}
            onBack={onBack}
            onConversationSelect={onConversationSelect}
          />
        );

      case 'chat':
        return (
          <MobileChatView
            isDarkMode={isDarkMode}
            mobileConversationId={mobileState.conversationId}
            onBack={onBack}
            channelId={mobileState.channelId}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="md:hidden w-full h-full absolute top-0 left-0 bg-inherit">
      {renderMobileView()}
    </div>
  );
};

const DesktopInterface: React.FC<{
  isDarkMode: boolean;
  activeChannel: string;
  onToggleSidebar?: () => void;
  initialConversationId?: string | null;
}> = ({
  isDarkMode,
  activeChannel,
  onToggleSidebar,
  initialConversationId
}) => (
  <div className="hidden md:flex h-full w-full">
    <WhatsAppChat
      isDarkMode={isDarkMode}
      channelId={activeChannel}
      onToggleSidebar={onToggleSidebar}
      initialConversationId={initialConversationId}
    />
  </div>
);

// Main Component
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
  
  const {
    mobileState,
    navigateToChannels,
    navigateToConversations,
    navigateToChat,
    navigateBack
  } = useMobileNavigation(
    activeChannel,
    showMobileSettings,
    initialConversationId,
    onCloseMobileSettings
  );

  const { overlayState, closeOverlay } = useChatOverlay(initialChannel, initialPhone);

  return (
    <div className={cn(
      "relative h-screen w-full",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* Mobile Interface */}
      <MobileInterface
        isDarkMode={isDarkMode}
        mobileState={mobileState}
        showMobileSettings={showMobileSettings}
        toggleDarkMode={toggleDarkMode}
        onChannelSelect={navigateToConversations}
        onConversationSelect={navigateToChat}
        onBack={navigateBack}
      />

      {/* Desktop Interface */}
      <DesktopInterface
        isDarkMode={isDarkMode}
        activeChannel={activeChannel}
        onToggleSidebar={onToggleSidebar}
        initialConversationId={initialConversationId}
      />

      {/* Chat Overlay */}
      {overlayState.isVisible && overlayState.channelId && (
        <ChatOverlay
          channelId={overlayState.channelId}
          isDarkMode={isDarkMode}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
};

