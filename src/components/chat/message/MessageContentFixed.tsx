
import React from 'react';
import { TextMessage } from './TextMessage';
import { MediaRendererFixed } from '../MediaRendererFixed';
import { ChatMessage } from '@/types/chat';

interface MessageContentFixedProps {
  message: ChatMessage;
  isDarkMode: boolean;
}

export const MessageContentFixed: React.FC<MessageContentFixedProps> = ({
  message,
  isDarkMode
}) => {
  // Verificar se é mídia
  const isMediaMessage = 
    (message.messageType && message.messageType !== 'text') ||
    message.content.startsWith('data:') ||
    (message.content.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(message.content.replace(/\s/g, '')));
  
  console.log('🎯 [MESSAGE_CONTENT_FIXED] Rendering:', {
    messageId: message.id,
    messageType: message.messageType,
    isMediaMessage,
    contentLength: message.content?.length || 0
  });
  
  if (isMediaMessage) {
    return (
      <MediaRendererFixed
        content={message.content}
        messageType={message.messageType}
        messageId={message.id}
        isDarkMode={isDarkMode}
        fileName={message.fileData?.fileName}
      />
    );
  }
  
  return <TextMessage content={message.content} isDarkMode={isDarkMode} />;
};
