import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isDarkMode: boolean;
  children: React.ReactNode;
  channelName?: string; // Nome do canal
  userName?: string; // Nome do usuário que enviou (se aplicável)
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isDarkMode,
  children,
  channelName,
  userName
}) => {
  const isOwn = message.isOwn || message.sender.type === 'agent';

  return (
    <div className={cn(
      "chat-message-row message-animate",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "relative max-w-[70%] px-4 py-2 rounded-lg shadow-md",
        isOwn
          ? "bg-primary text-primary-foreground rounded-br-none"
          : "bg-card text-card-foreground rounded-bl-none border border-border",
        isDarkMode ? "dark" : ""
      )}>
        {/* Header com informações do canal e remetente */}
        <div className={cn(
          "text-xs mb-1 space-y-0.5",
          isDarkMode ? "text-muted-foreground" : "text-gray-600"
        )}>
          {/* Nome do canal */}
          {channelName && (
            <div className="font-medium text-blue-600 dark:text-blue-400">
              📱 {channelName}
            </div>
          )}
          
          {/* Nome do cliente ou usuário */}
          {!isOwn && message.sender.name && (
            <div className="font-semibold">
              👤 {message.sender.name}
            </div>
          )}
          
          {/* Indicativo para mensagens enviadas pela barra de input */}
          {isOwn && userName && (
            <div className="font-semibold text-green-600 dark:text-green-400">
              ✏️ Enviado por: {userName}
            </div>
          )}
        </div>
        
        <div className="text-sm">
          {children}
        </div>
        
        <div className={cn(
          "text-[10px] mt-1 text-right",
          isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {isOwn && (
            <span className="ml-1">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

