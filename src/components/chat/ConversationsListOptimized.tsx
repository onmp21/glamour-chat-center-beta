
import React from 'react';
import { SimpleConversationsListWithRealtime } from './SimpleConversationsListWithRealtime';

interface ConversationsListOptimizedProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const ConversationsListOptimized: React.FC<ConversationsListOptimizedProps> = (props) => {
  console.log('📋 [CONVERSATIONS_LIST_OPTIMIZED] Rendering with:', props);
  return <SimpleConversationsListWithRealtime {...props} enableRealtime={true} />;
};
