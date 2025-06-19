
import React from 'react';
import { useSimpleConversationsWithRealtime } from '@/hooks/useSimpleConversationsWithRealtime';
import { cn } from '@/lib/utils';
import { Phone, MessageCircle } from 'lucide-react';

interface SimpleConversationsListWithRealtimeProps {
  channelId: string | null;
  activeConversation?: string | null;
  onConversationSelect: (conversationId: string) => void;
  isDarkMode: boolean;
  enableRealtime?: boolean;
}

export const SimpleConversationsListWithRealtime: React.FC<SimpleConversationsListWithRealtimeProps> = ({
  channelId,
  activeConversation,
  onConversationSelect,
  isDarkMode,
  enableRealtime = true
}) => {
  const { conversations, loading, error } = useSimpleConversationsWithRealtime(channelId, enableRealtime);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn(
            "animate-pulse rounded-lg p-4",
            isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
          )}>
            <div className={cn(
              "h-4 rounded mb-2",
              isDarkMode ? "bg-[#3f3f46]" : "bg-gray-200"
            )} />
            <div className={cn(
              "h-3 rounded w-2/3",
              isDarkMode ? "bg-[#3f3f46]" : "bg-gray-200"
            )} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className={cn(
          "text-center p-4 rounded-lg",
          isDarkMode ? "text-red-400 bg-red-950/50" : "text-red-600 bg-red-50"
        )}>
          Erro ao carregar conversas: {error}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <div className={cn(
          "text-center p-8 rounded-lg",
          isDarkMode ? "text-gray-400 bg-[#27272a]" : "text-gray-500 bg-gray-50"
        )}>
          <MessageCircle className="mx-auto mb-3 text-gray-400" size={48} />
          <p>Nenhuma conversa encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation.id)}
            className={cn(
              "p-3 rounded-lg cursor-pointer transition-colors duration-200",
              activeConversation === conversation.id
                ? isDarkMode
                  ? "bg-[#b5103c]/20 border-l-4 border-[#b5103c]"
                  : "bg-[#b5103c]/10 border-l-4 border-[#b5103c]"
                : isDarkMode
                ? "hover:bg-[#27272a]"
                : "hover:bg-gray-100"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={14} className="text-[#b5103c] flex-shrink-0" />
                  <h4 className={cn(
                    "font-medium text-sm truncate",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {conversation.contact_name}
                  </h4>
                </div>
                <p className={cn(
                  "text-xs truncate",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  {conversation.last_message}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <span className={cn(
                  "text-xs",
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                )}>
                  {new Date(conversation.last_message_time).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {conversation.unread_count > 0 && (
                  <span className="bg-[#b5103c] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
