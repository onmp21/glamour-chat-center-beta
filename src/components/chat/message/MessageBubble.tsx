
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isDarkMode: boolean;
  children: React.ReactNode;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isDarkMode,
  children
}) => {
  const isOwn = message.isOwn || message.sender.type === 'agent';

  return (
    <div className={cn(
      "chat-message-row message-animate",
      isOwn ? "sent" : "received"
    )}>
      <div className={cn(
        "chat-message-whatsapp",
        isOwn ? "sent" : "received"
      )}>
        {!isOwn && (
          <div className="chat-message-sender">
            {message.sender.name}
          </div>
        )}
        
        <div className="chat-message-content">
          {children}
        </div>
        
        <div className="chat-message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {isOwn && (
            <span className="checkmark">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};
