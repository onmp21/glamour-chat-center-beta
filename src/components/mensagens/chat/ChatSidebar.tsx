
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebarHeader } from './ChatSidebarHeader';
import { ConversationsList } from './ConversationsList';

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

interface ChatSidebarProps {
  channelId: string;
  conversations: Conversation[];
  selectedConversation: string | null;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onConversationSelect: (conversationId: string) => void;
  onSidebarToggle: (open: boolean) => void;
  onRefresh: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  channelId,
  conversations = [],
  selectedConversation,
  isSidebarOpen,
  isDarkMode,
  onClose,
  onConversationSelect,
  onSidebarToggle,
  onRefresh
}) => {
  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div className={cn(
      "w-80 border-r flex flex-col",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <ChatSidebarHeader 
        channelId={channelId}
        conversations={conversations}
        isDarkMode={isDarkMode}
        onClose={onClose}
        onSidebarToggle={onSidebarToggle}
        onRefresh={onRefresh}
      />
      
      <ConversationsList
        channelId={channelId}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onConversationSelect={onConversationSelect}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
