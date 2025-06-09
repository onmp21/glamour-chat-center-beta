
import React from 'react';
import { cn } from '@/lib/utils';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';
import { ConversationsListHeader } from './ConversationsListHeader';
import { ConversationsListEmpty } from './ConversationsListEmpty';
import { ConversationItem } from './ConversationItem';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationsListProps {
  channelId: string;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  channelId,
  activeConversation,
  onConversationSelect,
  isDarkMode
}) => {
  const {
    conversations,
    loading,
    refreshing,
    refreshConversations
  } = useChannelConversationsRefactored(channelId);
  
  console.log(`📋 [CONVERSATIONS_LIST] Rendering for channel ${channelId} with ${conversations.length} conversations`);
  
  const handleConversationClick = async (conversationId: string) => {
    console.log(`👆 [CONVERSATIONS_LIST] Conversation clicked: ${conversationId}`);
    onConversationSelect(conversationId);
  };
  
  if (loading) {
    return (
      <div className={cn("h-full flex items-center justify-center", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
        <div className={cn("animate-spin rounded-full h-6 w-6 border-b-2", isDarkMode ? "border-[#fafafa]" : "border-gray-900")}></div>
      </div>
    );
  }
  
  return (
    <div className={cn("h-full flex flex-col overflow-hidden", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
      <div className="flex-shrink-0">
        <ConversationsListHeader
          isDarkMode={isDarkMode}
          refreshing={refreshing}
          onRefresh={refreshConversations}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {conversations.length === 0 ? (
            <ConversationsListEmpty isDarkMode={isDarkMode} />
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map(conversation => (
                <ConversationItem
                  key={`${channelId}-${conversation.id}`}
                  conversation={conversation}
                  channelId={channelId}
                  isDarkMode={isDarkMode}
                  isActive={activeConversation === conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
