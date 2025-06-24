
import React from 'react';
import { TextMessage } from './TextMessage';
import { MediaRendererFixed } from '../MediaRendererFixed';
import { ChatMessage } from '@/types/chat';
import { isValidMediaUrl } from '@/utils/mediaUtils';

interface MessageContentFixedProps {
  message: ChatMessage;
  isDarkMode: boolean;
}

export const MessageContentFixed: React.FC<MessageContentFixedProps> = ({
  message,
  isDarkMode
}) => {
  // Verificar se é mídia baseado no tipo e conteúdo
  const isMediaMessage = 
    (message.messageType && message.messageType !== 'text') ||
    isValidMediaUrl(message.content);
  
  console.log('🎯 [MESSAGE_CONTENT_FIXED] Rendering:', {
    messageId: message.id,
    messageType: message.messageType,
    isMediaMessage,
    isValidUrl: isValidMediaUrl(message.content)
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
