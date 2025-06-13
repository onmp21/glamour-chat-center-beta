
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
  // Determinar se é mensagem enviada ou recebida baseado no tipo de remetente
  const isAgentMessage = message.sender === 'agent' || 
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
