
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
  // Phase 2: Switch to native Supabase realtime
  return <RealtimeConversationsList {...props} />;
};
