
import React from 'react';
import { RealtimeConversationsList } from './RealtimeConversationsList';

interface SimpleConversationsListWithRealtimeProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const SimpleConversationsListWithRealtime: React.FC<SimpleConversationsListWithRealtimeProps> = (props) => {
  // Usar apenas realtime nativo do Supabase - removido polling
  return <RealtimeConversationsList {...props} />;
};
