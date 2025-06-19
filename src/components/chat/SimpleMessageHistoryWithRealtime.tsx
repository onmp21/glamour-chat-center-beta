
import React from 'react';
import { useSimpleMessagesWithRealtime } from '@/hooks/useSimpleMessagesWithRealtime';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface SimpleMessageHistoryWithRealtimeProps {
  channelId: string | null;
  conversationId: string | null;
  isDarkMode: boolean;
  enableRealtime?: boolean;
}

export const SimpleMessageHistoryWithRealtime: React.FC<SimpleMessageHistoryWithRealtimeProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  enableRealtime = true
}) => {
  const { messages, loading, error } = useSimpleMessagesWithRealtime(channelId, conversationId, enableRealtime);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn(
            "animate-pulse rounded-lg p-3",
            i % 2 === 0 
              ? isDarkMode ? "bg-[#27272a] ml-8" : "bg-gray-100 ml-8"
              : isDarkMode ? "bg-[#3f3f46] mr-8" : "bg-gray-200 mr-8"
          )}>
            <div className={cn(
              "h-4 rounded",
              isDarkMode ? "bg-[#52525b]" : "bg-gray-300"
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
          Erro ao carregar mensagens: {error}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )}>
          <MessageCircle className="mx-auto mb-3 text-gray-400" size={48} />
          <p>Nenhuma mensagem encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => {
        const isFromContact = message.tipo_remetente === 'CONTATO_EXTERNO';
        
        return (
          <div
            key={message.id}
            className={cn(
              "flex",
              isFromContact ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3 text-sm",
                isFromContact
                  ? isDarkMode
                    ? "bg-[#27272a] text-white"
                    : "bg-gray-100 text-gray-900"
                  : "bg-[#b5103c] text-white"
              )}
            >
              {message.nome_do_contato && isFromContact && (
                <p className={cn(
                  "text-xs font-medium mb-1",
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {message.nome_do_contato}
                </p>
              )}
              
              <p className="break-words">
                {message.message || '[Mídia]'}
              </p>
              
              {message.read_at && (
                <p className={cn(
                  "text-xs mt-1 opacity-70",
                  isFromContact 
                    ? isDarkMode ? "text-gray-400" : "text-gray-500"
                    : "text-white/70"
                )}>
                  {new Date(message.read_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
