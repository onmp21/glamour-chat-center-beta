
import React from 'react';
import { cn } from '@/lib/utils';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';
import { useConversationStatus } from '@/hooks/useConversationStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, User } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MobileConversationsListProps {
  isDarkMode: boolean;
  mobileChannelId: string | null;
  onBack: () => void;
  onConversationSelect: (conversationId: string) => void;
}

export const MobileConversationsList: React.FC<MobileConversationsListProps> = ({
  isDarkMode,
  mobileChannelId,
  onBack,
  onConversationSelect
}) => {
  const { 
    conversations, 
    loading, 
    refreshing, 
    refreshConversations
  } = useChannelConversationsRefactored(mobileChannelId || '');

  const { updateConversationStatus } = useConversationStatus();

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM', { locale: ptBR });
    }
  };

  const handleConversationClick = async (conversationId: string) => {
    onConversationSelect(conversationId);
    // Auto-marcar como lido quando abrir a conversa
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation && conversation.status === 'unread') {      await updateConversationStatus(mobileChannelId || '', conversationId, 'in_progress', false); // Passar false para não mostrar toast
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isDarkMode ? "bg-zinc-950" : "bg-white"
      )}>
        <div className={cn(
          "animate-spin rounded-full h-6 w-6 border-b-2",
          isDarkMode ? "border-zinc-400" : "border-gray-900"
        )}></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen flex flex-col",
      isDarkMode ? "bg-zinc-950" : "bg-white"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between flex-shrink-0",
        "chat-header-height",
        isDarkMode ? "border-zinc-800" : "border-gray-200"
      )}>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "rounded-full",
              isDarkMode ? "text-zinc-100 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <ArrowLeft size={20} />
          </Button>
          
          <h2 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Conversas ({conversations.length})
          </h2>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshConversations}
          disabled={refreshing}
          className={cn(
            "h-8 w-8 p-0",
            isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"
          )}
        >
          <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Lista de conversas com scroll corrigido */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <User size={48} className={cn(
              "mx-auto mb-4",
              isDarkMode ? "text-zinc-600" : "text-gray-400"
            )} />
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-zinc-400" : "text-gray-600"
            )}>
              Nenhuma conversa encontrada
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={`mobile-${mobileChannelId}-${conversation.id}`}
              onClick={() => handleConversationClick(conversation.id)}
              className={cn(
                "p-4 border-b cursor-pointer transition-colors relative",
                isDarkMode ? "border-zinc-800 hover:bg-zinc-900" : "border-gray-100 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0",
                  conversation.status === 'unread' ? "bg-[#b5103c]" : (isDarkMode ? "bg-zinc-700" : "bg-gray-500")
                )}>
                  {conversation.contact_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-medium text-sm truncate",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {conversation.contact_name || conversation.contact_phone}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {(conversation.unread_count || 0) > 0 && (
                        <Badge 
                          variant="default" 
                          className="bg-[#b5103c] hover:bg-[#9d0e34] text-white text-xs"
                        >
                          {conversation.unread_count}
                        </Badge>
                      )}
                      <span className={cn(
                        "text-xs",
                        isDarkMode ? "text-zinc-400" : "text-gray-500"
                      )}>
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                  </div>
                  
                  <p className={cn(
                    "text-sm truncate mt-1",
                    isDarkMode ? "text-zinc-400" : "text-gray-600"
                  )}>
                    {conversation.last_message || 'Sem mensagens'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn(
                      "text-xs",
                      isDarkMode ? "text-zinc-500" : "text-gray-400"
                    )}>
                      {conversation.contact_phone}
                    </span>

                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
