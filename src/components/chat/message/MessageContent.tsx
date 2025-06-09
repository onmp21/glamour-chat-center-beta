
import React from 'react';
import { MessageContentFixed } from './MessageContentFixed';
import { ChatMessage } from '@/types/chat';

interface MessageContentProps {
  message: ChatMessage;
  isDarkMode: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = (props) => {
  return <MessageContentFixed {...props} />;
};
