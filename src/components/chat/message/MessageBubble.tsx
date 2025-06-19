
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isDarkMode: boolean;
  channelName?: string;
  userName?: string;
  children: React.ReactNode;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isDarkMode,
  channelName,
  userName,
  children
}) => {
  const isAgent = message.sender.type === 'agent' || message.isOwn;
  const senderName = isAgent ? (userName || message.sender.name) : message.sender.name;

  return (
    <div className={cn(
      "flex flex-col gap-1 mb-4",
      isAgent ? "items-end" : "items-start"
    )}>
      {/* Nome do remetente */}
      <div className={cn(
        "text-xs px-2",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        {senderName}
      </div>
      
      {/* Balão da mensagem */}
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2 break-words",
        isAgent 
          ? isDarkMode 
            ? "bg-[#b5103c] text-white" 
            : "bg-[#b5103c] text-white"
          : isDarkMode 
            ? "bg-[#27272a] text-white border border-[#3f3f46]" 
            : "bg-gray-100 text-gray-900 border border-gray-200"
      )}>
        {children}
      </div>
      
      {/* Timestamp */}
      <div className={cn(
        "text-xs px-2",
        isDarkMode ? "text-gray-500" : "text-gray-500"
      )}>
        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};
