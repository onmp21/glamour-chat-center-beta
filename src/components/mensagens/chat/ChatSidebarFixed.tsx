
import React, { useState, useMemo } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConversationSearch } from './ConversationSearch';
import { ConversationCardFixed } from './ConversationCardFixed';

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

interface ChatSidebarFixedProps {
  channelId: string;
  conversations: Conversation[];
  selectedConversation: string | null;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onConversationSelect: (id: string) => void;
  onSidebarToggle: (open: boolean) => void;
  onRefresh: () => void;
}

export const ChatSidebarFixed: React.FC<ChatSidebarFixedProps> = ({
  channelId,
  conversations,
  selectedConversation,
  isSidebarOpen,
  isDarkMode,
  onClose,
  onConversationSelect,
  onSidebarToggle,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    
    const search = searchTerm.toLowerCase();
    return conversations.filter(conv => 
      conv.contact_name.toLowerCase().includes(search) ||
      conv.contact_phone.includes(search)
    );
  }, [conversations, searchTerm]);

  const getChannelDisplayName = (channelId: string) => {
    const channelNames: Record<string, string> = {
      'chat': 'Yelena AI',
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Yelena AI',
      'canarana': 'Canarana',
      'souto-soares': 'Souto Soares',
      'joao-dourado': 'João Dourado',
      'america-dourada': 'América Dourada',
      'gerente-lojas': 'Gerente Lojas',
      'gerente-externo': 'Gerente Externo',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'Gerente Externo'
    };
    return channelNames[channelId] || 'Canal';
  };

  if (!isSidebarOpen) return null;

  return (
    <div className={cn(
      "w-80 flex flex-col border-r",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
      )}>
        <h2 className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {getChannelDisplayName(channelId)}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <ConversationSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isDarkMode={isDarkMode}
      />

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className={cn(
              "text-4xl mb-4",
              isDarkMode ? "text-gray-600" : "text-gray-400"
            )}>
              💬
            </div>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationCardFixed
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation === conversation.id}
              isDarkMode={isDarkMode}
              onClick={() => onConversationSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
