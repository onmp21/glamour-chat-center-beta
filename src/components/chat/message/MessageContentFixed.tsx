
import React from 'react';
import { TextMessage } from './TextMessage';
import { MediaRendererFixed } from '../MediaRendererFixed';
import { ChatMessage } from '@/types/chat';
import { isMediaMessage } from '@/utils/mediaUtils';

interface MessageContentFixedProps {
  message: ChatMessage;
  isDarkMode: boolean;
  balloonColor?: 'sent' | 'received';
}

export const MessageContentFixed: React.FC<MessageContentFixedProps> = ({
  message,
  isDarkMode,
  balloonColor = 'received'
}) => {
  // Verificar se é mídia baseado no tipo e conteúdo
  const isMedia = isMediaMessage(message.content, message.messageType);
  
  console.log('🎯 [MESSAGE_CONTENT_FIXED] Rendering:', {
    messageId: message.id,
    messageType: message.messageType,
    isMedia,
    balloonColor,
    contentPreview: message.content.substring(0, 50)
  });
  
  if (isMedia) {
    return (
      <MediaRendererFixed
        content={message.content}
        messageType={message.messageType}
        messageId={message.id}
        isDarkMode={isDarkMode}
        balloonColor={balloonColor}
        fileName={message.fileData?.fileName}
      />
    );
  }
  
  return <TextMessage content={message.content} isDarkMode={isDarkMode} />;
};
