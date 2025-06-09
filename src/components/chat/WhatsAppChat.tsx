
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChannelsSection } from './ChannelsSection';
import { ConversationsList } from './ConversationsList';
import { MessageHistory } from './MessageHistory';
import { MessageInput } from './MessageInput';
import { ConversationHeader } from './ConversationHeader';
import { ConversationStatusManager } from './ConversationStatusManager';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';

interface WhatsAppChatProps {
  isDarkMode: boolean;
  channelId: string;
  onToggleSidebar?: () => void;
  initialConversationId?: string | null;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  isDarkMode,
  channelId,
  onToggleSidebar,
  initialConversationId = null
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>(channelId === 'channels' ? 'chat' : channelId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversationId);
  const { conversations } = useChannelConversationsRefactored(selectedChannel);

  useEffect(() => {
    if (channelId !== 'channels') {
      setSelectedChannel(channelId);
    }
  }, [channelId]);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversation(initialConversationId);
    }
  }, [initialConversationId]);

  const handleChannelSelect = (newChannelId: string) => {
    setSelectedChannel(newChannelId);
    setSelectedConversation(null);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className={cn(
      "flex h-screen",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* Channels Sidebar */}
      {channelId === 'channels' && (
        <div className={cn(
          "w-80 border-r flex-shrink-0",
          isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <ChannelsSection
            isDarkMode={isDarkMode}
            activeChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
          />
        </div>
      )}

      {/* Conversations List */}
      <div className={cn(
        "w-80 border-r flex-shrink-0",
        isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <ConversationsList
          channelId={selectedChannel}
          activeConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className={cn(
              "p-4 border-b flex items-center justify-between",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <ConversationHeader
                conversation={selectedConversationData}
                channelId={selectedChannel}
                isDarkMode={isDarkMode}
              />
              
              <ConversationStatusManager
                channelId={selectedChannel}
                conversationId={selectedConversation}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageHistory
                channelId={selectedChannel}
                conversationId={selectedConversation}
                isDarkMode={isDarkMode}
                className="h-full"
              />
            </div>

            {/* Message Input */}
            <div className={cn(
              "border-t",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <MessageInput
                channelId={selectedChannel}
                conversationId={selectedConversation}
                isDarkMode={isDarkMode}
              />
            </div>
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
};
