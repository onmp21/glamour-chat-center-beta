
import React from 'react';
import { RealtimeConversationsList } from './RealtimeConversationsList';

interface SimpleConversationsListWithRealtimeProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
  enableRealtime?: boolean;
}

export const SimpleConversationsListWithRealtime: React.FC<SimpleConversationsListWithRealtimeProps> = ({
  enableRealtime = true,
  ...props
}) => {
  // Usar apenas realtime nativo do Supabase
  return <RealtimeConversationsList {...props} />;
};
