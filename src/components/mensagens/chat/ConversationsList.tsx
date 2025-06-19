
import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
}

interface ConversationsListProps {
  channelId: string;
  conversations: Conversation[];
  selectedConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  channelId,
  conversations,
  selectedConversation,
  onConversationSelect,
  isDarkMode
}) => {
  console.log(`📋 [CONVERSATIONS_LIST] Rendering ${conversations.length} conversations for channel ${channelId}`);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={cn("text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
          <div className="text-4xl mb-4">💬</div>
          <p>Nenhuma conversa encontrada</p>
          <p className="text-sm mt-1">As conversas aparecerão aqui quando chegarem mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-colors",
                selectedConversation === conversation.id
                  ? "bg-[#b5103c] text-white"
                  : isDarkMode
                    ? "hover:bg-[#18181b] text-white"
                    : "hover:bg-gray-100 text-gray-900"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {conversation.contact_name}
                  </h4>
                  <p className={cn(
                    "text-sm truncate mt-1",
                    selectedConversation === conversation.id
                      ? "text-white/80"
                      : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-600"
                  )}>
                    {conversation.last_message.length > 50 
                      ? conversation.last_message.substring(0, 50) + '...'
                      : conversation.last_message
                    }
                  </p>
                </div>
                <div className="text-xs ml-2">
                  {new Date(conversation.last_message_time).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {conversation.unread_count > 0 && (
                <div className="mt-2 flex justify-end">
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {conversation.unread_count}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
