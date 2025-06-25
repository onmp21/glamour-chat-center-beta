
import React from 'react';
import { InfiniteMessageHistory } from './InfiniteMessageHistory';

interface MessageHistoryProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  className?: string;
}

export const MessageHistory: React.FC<MessageHistoryProps> = (props) => {
  console.log('📋 [MESSAGE_HISTORY] Rendering with infinite scroll:', props);
  return <InfiniteMessageHistory {...props} />;
};
