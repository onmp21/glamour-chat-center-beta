
import React from 'react';
import { RealtimeMessageHistory } from './RealtimeMessageHistory';

interface SimpleMessageHistoryProps {
  channelId: string | null;
  conversationId: string | null;
  isDarkMode: boolean;
}

export const SimpleMessageHistory: React.FC<SimpleMessageHistoryProps> = (props) => {
  // Usar apenas realtime nativo do Supabase
  return <RealtimeMessageHistory {...props} />;
};
