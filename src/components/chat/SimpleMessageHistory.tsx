
import React from 'react';
import { RealtimeMessageHistory } from './RealtimeMessageHistory';

interface SimpleMessageHistoryProps {
  channelId: string | null;
  conversationId: string | null;
  isDarkMode: boolean;
}

export const SimpleMessageHistory: React.FC<SimpleMessageHistoryProps> = (props) => {
  // Phase 2: Switch to native Supabase realtime
  return <RealtimeMessageHistory {...props} />;
};
