
import React from 'react';
import { MediaMessageRenderer } from '../MediaMessageRenderer';
import { ChatMessage } from '@/types/chat';

interface MediaMessageProps {
  message: ChatMessage;
  isDarkMode: boolean;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({
  message,
  isDarkMode
}) => {
  return (
    <MediaMessageRenderer
      content={message.content}
      messageType={message.messageType}
      messageId={message.id}
      isDarkMode={isDarkMode}
      fileName={message.fileData?.fileName}
    />
  );
};
