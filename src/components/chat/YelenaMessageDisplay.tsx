
import React from 'react';
import { cn } from '@/lib/utils';
import { MediaMessageRenderer } from './MediaMessageRenderer';

interface YelenaMessageDisplayProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    sender: string;
    tipo_remetente?: string;
    isOwn?: boolean;
    agentName?: string;
    Nome_do_contato?: string;
    nome_do_contato?: string;
    mensagemtype?: string;
  };
  isDarkMode: boolean;
  channelName?: string;
  userName?: string;
}

export const YelenaMessageDisplay: React.FC<YelenaMessageDisplayProps> = ({ 
  message, 
  isDarkMode,
  channelName = 'Yelena AI',
  userName
}) => {
  const isAgent = 
    message.tipo_remetente === 'USUARIO_INTERNO' || 
    message.tipo_remetente === 'Yelena-ai' ||
    message.sender === 'agent' || 
    message.isOwn;

  const displayName = isAgent 
    ? (message.agentName || 'Yelena') 
    : (message.Nome_do_contato || message.nome_do_contato || message.sender || 'Cliente');

  const renderMessageContent = () => {
    const isMediaMessage = message.mensagemtype && message.mensagemtype !== 'text';
    if (isMediaMessage) {
      return (
        <MediaMessageRenderer
          content={message.content}
          messageType={message.mensagemtype}
          messageId={message.id}
          isDarkMode={isDarkMode}
          balloonColor={isAgent ? 'sent' : 'received'}
        />
      );
    }
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <div className={cn(
      "chat-message-whatsapp message-animate",
      isAgent ? "sent" : "received"
    )}>
      <div className="chat-message-header">
        <div className="channel-name">
          📱 {channelName}
        </div>
        {!isAgent && (
          <div className="chat-message-sender">
            👤 {displayName}
          </div>
        )}
        {isAgent && userName && (
          <div className="user-indicator">
            ✏️ Enviado por: {userName}
          </div>
        )}
      </div>
      <div className="chat-message-content">
        {renderMessageContent()}
      </div>
      <div className="chat-message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
        {isAgent && (
          <span className="checkmark">✓✓</span>
        )}
      </div>
    </div>
  );
};
