
import React from 'react';
import { cn } from '@/lib/utils';
import { MediaMessageRenderer } from './MediaMessageRenderer';

interface AndressaMessageDisplayProps {
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
}

export const AndressaMessageDisplay: React.FC<AndressaMessageDisplayProps> = ({ 
  message, 
  isDarkMode 
}) => {
  const isAgent = 
    message.tipo_remetente === 'USUARIO_INTERNO' || 
    message.tipo_remetente === 'Andressa-ai' ||
    message.sender === 'agent' || 
    message.isOwn;
  
  const displayName = isAgent 
    ? (message.agentName || 'Andressa') 
    : (message.Nome_do_contato || message.nome_do_contato || message.sender || 'Cliente');

  const renderMessageContent = () => {
    // Verificar se é mídia
    const isMediaMessage = message.mensagemtype && message.mensagemtype !== 'text';
    
    if (isMediaMessage) {
      return (
        <MediaMessageRenderer
          content={message.content}
          messageType={message.mensagemtype}
          messageId={message.id}
          isDarkMode={isDarkMode}
        />
      );
    }
    
    // Texto normal
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <div className={cn(
      "chat-message-whatsapp message-animate",
      isAgent ? "sent" : "received"
    )}>
      {!isAgent && (
        <div className="chat-message-sender">
          {displayName}
        </div>
      )}
      
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
