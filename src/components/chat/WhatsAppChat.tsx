import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChannelsSection } from './ChannelsSection';
import { ConversationsList } from './ConversationsList';
import { MessageHistory } from './MessageHistory';
import { MessageInput } from './MessageInput';
import { ConversationHeader } from './ConversationHeader';
import { ConversationStatusManager } from './ConversationStatusManager';
import { useSimpleConversationsWithRealtime } from '@/hooks/useSimpleConversationsWithRealtime';

// Types
interface WhatsAppChatProps {
  isDarkMode: boolean;
  channelId: string;
  onToggleSidebar?: () => void;
  initialConversationId?: string | null;
}

interface ChatState {
  selectedChannel: string;
  selectedConversation: string | null;
}

// Constants
const DEFAULT_CHANNEL = 'chat';
const SIDEBAR_WIDTH = 'w-80';

// Custom Hooks
const useChatState = (
  channelId: string,
  initialConversationId: string | null
): [ChatState, (channel: string) => void, (conversation: string) => void] => {
  const [chatState, setChatState] = useState<ChatState>({
    selectedChannel: channelId === 'channels' ? DEFAULT_CHANNEL : channelId,
    selectedConversation: initialConversationId
  });

  // Update selected channel when channelId prop changes
  useEffect(() => {
    if (channelId !== 'channels') {
      setChatState(prev => ({
        ...prev,
        selectedChannel: channelId
      }));
    }
  }, [channelId]);

  // Update selected conversation when initialConversationId changes
  useEffect(() => {
    if (initialConversationId) {
      setChatState(prev => ({
        ...prev,
        selectedConversation: initialConversationId
      }));
    }
  }, [initialConversationId]);

  const handleChannelSelect = (newChannelId: string) => {
    setChatState({
      selectedChannel: newChannelId,
      selectedConversation: null // Reset conversation when changing channels
    });
  };

  const handleConversationSelect = (conversationId: string) => {
    setChatState(prev => ({
      ...prev,
      selectedConversation: conversationId
    }));
  };

  return [chatState, handleChannelSelect, handleConversationSelect];
};

// Components
const ChannelsSidebar: React.FC<{
  isDarkMode: boolean;
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
  isVisible: boolean;
}> = ({ isDarkMode, selectedChannel, onChannelSelect, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      SIDEBAR_WIDTH,
      "border-r flex-shrink-0",
      isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <ChannelsSection
        isDarkMode={isDarkMode}
        activeChannel={selectedChannel}
        onChannelSelect={onChannelSelect}
      />
    </div>
  );
};

const ConversationsSidebar: React.FC<{
  isDarkMode: boolean;
  channelId: string;
  selectedConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
}> = ({ isDarkMode, channelId, selectedConversation, onConversationSelect }) => (
  <div className={cn(
    SIDEBAR_WIDTH,
    "border-r flex-shrink-0",
    isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200"
  )}>
    <ConversationsList
      channelId={channelId}
      activeConversation={selectedConversation}
      onConversationSelect={onConversationSelect}
      isDarkMode={isDarkMode}
    />
  </div>
);

const ChatHeader: React.FC<{
  isDarkMode: boolean;
  conversation: any;
  channelId: string;
  conversationId: string;
}> = ({ isDarkMode, conversation, channelId, conversationId }) => (
  <div className={cn(
    "p-4 border-b flex items-center justify-between",
    isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
  )}>
    <ConversationHeader
      conversation={conversation}
      channelId={channelId}
      isDarkMode={isDarkMode}
    />
    
    <ConversationStatusManager
      channelId={channelId}
      conversationId={conversationId}
      isDarkMode={isDarkMode}
    />
  </div>
);

const ChatMessages: React.FC<{
  isDarkMode: boolean;
  channelId: string;
  conversationId: string;
}> = ({ isDarkMode, channelId, conversationId }) => (
  <div className="flex-1 overflow-hidden">
    <MessageHistory
      channelId={channelId}
      conversationId={conversationId}
      isDarkMode={isDarkMode}
      className="h-full"
    />
  </div>
);

const ChatInput: React.FC<{
  isDarkMode: boolean;
  channelId: string;
  conversationId: string;
}> = ({ isDarkMode, channelId, conversationId }) => (
  <div className={cn(
    "border-t",
    isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
  )}>
    <MessageInput
      channelId={channelId}
      conversationId={conversationId}
      isDarkMode={isDarkMode}
    />
  </div>
);

const EmptyState: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center">
      <p className={cn(
        "text-lg font-medium mb-2",
        isDarkMode ? "text-[#fafafa]" : "text-gray-600"
      )}>
        Selecione uma conversa para começar
      </p>
      <p className={cn(
        "text-sm",
        isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
      )}>
        Escolha um canal e uma conversa para visualizar as mensagens
      </p>
    </div>
  </div>
);

const ChatArea: React.FC<{
  isDarkMode: boolean;
  selectedChannel: string;
  selectedConversation: string | null;
  conversations: any[];
}> = ({ isDarkMode, selectedChannel, selectedConversation, conversations }) => {
  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="flex-1 flex flex-col">
      {selectedConversation && selectedConversationData ? (
        <>
          <ChatHeader
            isDarkMode={isDarkMode}
            conversation={selectedConversationData}
            channelId={selectedChannel}
            conversationId={selectedConversation}
          />

          <ChatMessages
            isDarkMode={isDarkMode}
            channelId={selectedChannel}
            conversationId={selectedConversation}
          />

          <ChatInput
            isDarkMode={isDarkMode}
            channelId={selectedChannel}
            conversationId={selectedConversation}
          />
        </>
      ) : (
        <EmptyState isDarkMode={isDarkMode} />
      )}
    </div>
  );
};

// Main Component
export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  isDarkMode,
  channelId,
  onToggleSidebar,
  initialConversationId = null
}) => {
  const [chatState, handleChannelSelect, handleConversationSelect] = useChatState(
    channelId,
    initialConversationId
  );

  const { conversations } = useSimpleConversationsWithRealtime(chatState.selectedChannel);

  const showChannelsSidebar = channelId === 'channels';

  return (
    <div className={cn(
      "flex h-screen",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* Channels Sidebar */}
      <ChannelsSidebar
        isDarkMode={isDarkMode}
        selectedChannel={chatState.selectedChannel}
        onChannelSelect={handleChannelSelect}
        isVisible={showChannelsSidebar}
      />

      {/* Conversations Sidebar */}
      <ConversationsSidebar
        isDarkMode={isDarkMode}
        channelId={chatState.selectedChannel}
        selectedConversation={chatState.selectedConversation}
        onConversationSelect={handleConversationSelect}
      />

      {/* Chat Area */}
      <ChatArea
        isDarkMode={isDarkMode}
        selectedChannel={chatState.selectedChannel}
        selectedConversation={chatState.selectedConversation}
        conversations={conversations}
      />
    </div>
  );
};

