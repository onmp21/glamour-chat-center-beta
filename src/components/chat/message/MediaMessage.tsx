
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
  // Fix: Check if sender object exists and has type property
  const isAgentMessage = message.sender?.type === 'agent' || 
    (message as any).tipo_remetente === 'USUARIO_INTERNO' ||
    (message as any).tipo_remetente === 'Yelena-ai' ||
    (message as any).tipo_remetente === 'Andressa-ai';

  return (
    <MediaMessageRenderer
      content={message.content}
      messageType={message.messageType}
      messageId={message.id}
      isDarkMode={isDarkMode}
      fileName={message.fileData?.fileName}
      balloonColor={isAgentMessage ? 'sent' : 'received'}
    />
  );
};
