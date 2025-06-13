
import React from 'react';
import { cn } from '@/lib/utils';
import { useSimpleConversations } from '@/hooks/useSimpleConversations';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SimpleConversationsListProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
}

export const SimpleConversationsList: React.FC<SimpleConversationsListProps> = ({
  channelId,
  activeConversation,
  onConversationSelect,
  isDarkMode
}) => {
  const { conversations, loading, error } = useSimpleConversations(channelId);

  if (loading) {
    return (
      <div className={cn("h-full flex items-center justify-center", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
        <div className="text-center space-y-2">
          <div className={cn("animate-spin rounded-full h-6 w-6 border-b-2 mx-auto", isDarkMode ? "border-white" : "border-gray-900")}></div>
          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Carregando conversas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("h-full flex items-center justify-center p-4", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
        <div className="text-center text-red-500">
          <p className="text-sm">Erro ao carregar conversas</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col overflow-hidden", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
          Conversas ({conversations.length})
        </h3>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                Nenhuma conversa encontrada
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors",
                    activeConversation === conversation.id
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
                        activeConversation === conversation.id
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
