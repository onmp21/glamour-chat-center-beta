
import React from 'react';
import { cn } from '@/lib/utils';
import { useLazyConversationsList } from '@/hooks/useLazyConversationsList';
import { ConversationsListHeader } from './ConversationsListHeader';
import { ConversationsListEmpty } from './ConversationsListEmpty';
import { ConversationItem } from './ConversationItem';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationsListOptimizedProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const ConversationsListOptimized: React.FC<ConversationsListOptimizedProps> = ({
  channelId,
  activeConversation,
  onConversationSelect,
  isDarkMode
}) => {
  const {
    conversations,
    loading,
    error,
    refreshConversations
  } = useLazyConversationsList(channelId);
  
  console.log(`📋 [CONVERSATIONS_LIST_OPTIMIZED] Rendering for channel ${channelId} with ${conversations.length} conversations`);
  
  const handleConversationClick = async (conversationId: string) => {
    console.log(`👆 [CONVERSATIONS_LIST_OPTIMIZED] Conversation clicked: ${conversationId}`);
    onConversationSelect(conversationId);
  };
  
  if (loading) {
    return (
      <div className={cn("h-full flex items-center justify-center", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
        <div className="text-center space-y-2">
          <div className={cn("animate-spin rounded-full h-6 w-6 border-b-2 mx-auto", isDarkMode ? "border-[#fafafa]" : "border-gray-900")}></div>
          <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
            Carregando conversas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("h-full flex items-center justify-center p-4", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
        <div className="text-center space-y-2">
          <p className={cn("text-sm text-red-500")}>
            Erro ao carregar conversas
          </p>
          <button
            onClick={refreshConversations}
            className={cn("text-xs px-3 py-1 rounded-md", isDarkMode ? "bg-[#18181b] hover:bg-[#27272a]" : "bg-gray-100 hover:bg-gray-200")}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("h-full flex flex-col overflow-hidden", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
      <div className="flex-shrink-0">
        <ConversationsListHeader
          isDarkMode={isDarkMode}
          refreshing={false}
          onRefresh={refreshConversations}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {conversations.length === 0 && !loading ? (
            <ConversationsListEmpty isDarkMode={isDarkMode} />
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map(conversation => (
                <ConversationItem
                  key={`${channelId}-${conversation.id}`}
                  conversation={conversation}
                  channelId={channelId || ''}
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
