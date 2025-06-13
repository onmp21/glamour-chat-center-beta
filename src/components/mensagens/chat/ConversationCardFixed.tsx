
import React from 'react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
}

interface ConversationCardFixedProps {
  conversation: Conversation;
  isSelected: boolean;
  isDarkMode: boolean;
  onClick: () => void;
}

export const ConversationCardFixed: React.FC<ConversationCardFixedProps> = ({
  conversation,
  isSelected,
  isDarkMode,
  onClick
}) => {
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString('pt-BR', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
      }
    } catch {
      return '';
    }
  };

  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const getLastMessagePreview = (message: string) => {
    if (!message) return '';
    
    // Check if it's a media message
    if (message.includes('[Imagem]')) return '📷 Imagem';
    if (message.includes('[Áudio]')) return '🎵 Áudio';
    if (message.includes('[Vídeo]')) return '🎬 Vídeo';
    if (message.includes('[Documento]')) return '📄 Documento';
    if (message.includes('[Mídia]')) return '📎 Mídia';
    
    // For text messages, truncate
    if (message.length > 35) {
      return message.substring(0, 35) + '...';
    }
    return message;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center p-3 cursor-pointer transition-all duration-200 border-b",
        isSelected
          ? isDarkMode
            ? "bg-[#b5103c]/20 border-[#b5103c]/30"
            : "bg-[#b5103c]/10 border-[#b5103c]/20"
          : isDarkMode
            ? "hover:bg-[#27272a] border-[#3f3f46]/50"
            : "hover:bg-gray-50 border-gray-200/50"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0",
        isSelected ? "bg-[#b5103c]" : "bg-gray-500"
      )}>
        {conversation.contact_name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            "font-medium text-sm truncate",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {truncateName(conversation.contact_name)}
          </h3>
          {conversation.last_message_time && (
            <span className={cn(
              "text-xs flex-shrink-0 ml-2",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              {formatTime(conversation.last_message_time)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className={cn(
            "text-xs truncate",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>
            {getLastMessagePreview(conversation.last_message)}
          </p>
          
          {conversation.unread_count > 0 && (
            <span className="bg-[#b5103c] text-white text-xs rounded-full px-2 py-1 ml-2 flex-shrink-0 min-w-[20px] text-center">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
