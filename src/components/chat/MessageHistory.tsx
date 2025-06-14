
import React from 'react';
import { SimpleMessageHistory } from './SimpleMessageHistory';

interface MessageHistoryProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  className?: string;
}

export const MessageHistory: React.FC<MessageHistoryProps> = (props) => {
  console.log('📋 [MESSAGE_HISTORY] Rendering with:', props);
  return <SimpleMessageHistory {...props} />;
};
