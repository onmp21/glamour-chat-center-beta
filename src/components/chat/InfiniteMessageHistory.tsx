import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useInfiniteMessages } from '@/hooks/useInfiniteMessages';
import { DateSeparator } from './DateSeparator';
import { MediaRendererFixed } from './MediaRendererFixed';
import { isMediaMessage } from '@/utils/mediaUtils';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { groupConsecutiveMessages } from '@/utils/messageGrouping';
import { formatTimestamp, parseTimestamp } from '@/utils/timestampUtils';

interface InfiniteMessageHistoryProps {
  channelId: string | null;
  conversationId: string | null;
  isDarkMode: boolean;
  className?: string;
}

export const InfiniteMessageHistory: React.FC<InfiniteMessageHistoryProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { messages, loading, hasMore, loadMoreMessages } = useInfiniteMessages(channelId, conversationId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // Scroll automático para baixo no carregamento inicial
  useLayoutEffect(() => {
    if (messagesEndRef.current && isInitialLoadRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
      console.log('📜 [INFINITE_SCROLL] Initial scroll to bottom completed');
    }
  }, [messages.length]);

  // Reset quando mudar conversa
  useLayoutEffect(() => {
    isInitialLoadRef.current = true;
  }, [conversationId]);

  // Detectar scroll no topo para carregar mais mensagens
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Se chegou próximo ao topo (20px de margem)
    if (scrollTop <= 20) {
      console.log('📜 [INFINITE_SCROLL] Loading more messages...');
      loadMoreMessages();
    }
  }, [loading, hasMore, loadMoreMessages]);

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach((message) => {
      try {
        const messageDate = parseTimestamp(message.timestamp);
        const dateKey = format(messageDate, 'yyyy-MM-dd');
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(message);
      } catch (error) {
        console.error('Error grouping message by date:', message, error);
      }
    });
    
    return groups;
  };

  if (!channelId || !conversationId) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 text-center",
        className,
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        <p>Selecione uma conversa para visualizar mensagens</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const sortedDates = Object.keys(groupedMessages).sort();

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn("flex-1 overflow-y-auto p-4", className)}
      style={{ 
        scrollBehavior: 'auto',
        height: '100%'
      }}
    >
      {/* Loading indicator para mais mensagens */}
      {loading && hasMore && (
        <div className="flex justify-center py-2">
          <div className={cn(
            "animate-spin rounded-full h-4 w-4 border-b-2",
            isDarkMode ? "border-white" : "border-gray-900"
          )}></div>
        </div>
      )}

      {/* Mensagens agrupadas por data */}
      <div className="space-y-4">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="space-y-1">
            {/* Separador de data */}
            <DateSeparator date={dateKey} isDarkMode={isDarkMode} />

            {/* Mensagens do dia agrupadas por remetente */}
            {groupConsecutiveMessages(groupedMessages[dateKey]).map((group, groupIndex) => (
              <div key={`${dateKey}-${groupIndex}`} className={cn(
                "flex flex-col space-y-1 mb-4",
                group.isFromContact ? "items-start" : "items-end"
              )}>
                {/* Mensagens do grupo - cada uma com tamanho independente */}
                {group.messages.map((message, messageIndex) => {
                  const messageType = message.mensagemtype || 'text';
                  const isMedia = isMediaMessage(message.content, message.mensagemtype);

                  return (
                    <div key={`${message.id}-${messageIndex}`} className={cn(
                      "max-w-[50%] w-fit",
                      group.isFromContact ? "self-start" : "self-end"
                    )}>
                      <div className={cn(
                        "px-3 py-2 text-sm shadow-sm relative",
                        group.isFromContact
                          ? isDarkMode
                            ? "bg-[#18181b] text-white rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-zinc-800"
                            : "bg-white text-gray-900 rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-gray-200"
                          : "bg-[#b5103c] text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md"
                      )}>
                        {/* Conteúdo da mensagem */}
                        <div className={cn(
                          "flex flex-col",
                          isMedia ? "space-y-2" : ""
                        )}>
                          {isMedia ? (
                            <div className="pb-6 mb-1">
                              <MediaRendererFixed
                                content={message.content}
                                messageType={messageType}
                                messageId={message.id}
                                isDarkMode={isDarkMode}
                                balloonColor={group.isFromContact ? 'received' : 'sent'}
                                className="max-w-full"
                              />
                              {/* Hora para mensagens de mídia - posicionada no canto inferior direito */}
                              <div className="absolute bottom-1 right-2">
                                <span className={cn(
                                  "text-xs",
                                  group.isFromContact
                                    ? isDarkMode 
                                      ? "text-gray-400" 
                                      : "text-gray-500"
                                    : "text-white/70"
                                )}>
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="pr-12 pb-4">
                              <p className="break-words whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                          )}
                          
                          {/* Hora dentro do balão - canto inferior direito (apenas para não-mídia) */}
                          {!isMedia && (
                            <div className="absolute bottom-1 right-2">
                              <span className={cn(
                                "text-xs",
                                group.isFromContact
                                  ? isDarkMode 
                                    ? "text-gray-400" 
                                    : "text-gray-500"
                                  : "text-white/70"
                              )}>
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Elemento para scroll automático para baixo */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
    </div>
  );
};
