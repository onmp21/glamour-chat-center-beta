
import React from 'react';
import { SimpleMessageHistoryWithRealtime } from './SimpleMessageHistoryWithRealtime';

interface SimpleMessageHistoryProps {
  channelId: string | null;
  conversationId: string | null;
  isDarkMode: boolean;
}

export const SimpleMessageHistory: React.FC<SimpleMessageHistoryProps> = (props) => {
  return <SimpleMessageHistoryWithRealtime {...props} enableRealtime={true} />;
};
