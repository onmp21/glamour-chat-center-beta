
import React from 'react';
import { RealtimeConversationsList } from './RealtimeConversationsList';

interface ConversationsListOptimizedProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const ConversationsListOptimized: React.FC<ConversationsListOptimizedProps> = (props) => {
  console.log('📋 [CONVERSATIONS_LIST_OPTIMIZED] Rendering with realtime only:', props);
  // Usar apenas realtime nativo do Supabase - removido polling
  return <RealtimeConversationsList {...props} />;
};
