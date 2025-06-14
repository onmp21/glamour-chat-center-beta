import React, { useRef, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLazyChannelMessages } from '@/hooks/useLazyChannelMessages';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { MediaMessageRenderer } from './MediaMessageRenderer';

interface MessageHistoryOptimizedProps {
  channelId: string | null;
  conversationId?: string;
  isDarkMode: boolean;
  className?: string;
}

const convertToBrasiliaTime = (timestamp: string): Date => {
  try {
    const date = parseISO(timestamp);
    const brasiliaTimeString = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    return new Date(brasiliaTimeString);
  } catch (error) {
    console.error(`Error converting timestamp ${timestamp} to Brasília time:`, error);
    const nowBrasiliaString = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    return new Date(nowBrasiliaString);
  }
};

export const MessageHistoryOptimized: React.FC<MessageHistoryOptimizedProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { user } = useAuth();
  const { messages, loading, error } = useLazyChannelMessages(channelId, conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SCROLL FORÇADO PARA O FINAL - MÚLTIPLAS ESTRATÉGIAS
  useLayoutEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Estratégia 1: Scroll direto para o máximo
        container.scrollTop = container.scrollHeight;
        
        // Estratégia 2: scrollIntoView no elemento final
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto',
            block: 'end'
          });
        }
        
        console.log('📜 [SCROLL_OPTIMIZED] Forced scroll to bottom. ScrollTop:', container.scrollTop, 'ScrollHeight:', container.scrollHeight);
      }
    };

    if (messages.length > 0) {
      // Scroll imediato
      scrollToBottom();
      
      // Múltiplas tentativas com delays diferentes
      const timeouts = [0, 10, 50, 100, 200, 500, 1000].map(delay =>
        setTimeout(scrollToBottom, delay)
      );
      
      return () => timeouts.forEach(clearTimeout);
    }
  }, [messages.length, conversationId, channelId]);

  const formatMessageTime = (timestamp: string) => {
    try {
      const brasiliaDate = convertToBrasiliaTime(timestamp);
      return format(brasiliaDate, 'HH:mm', { locale: ptBR });
    } catch (error) {
      console.error("Error formatting message time:", error);
      return '--:--';
    }
  };

  const formatDateSeparator = (timestamp: string) => {
    try {
      const brasiliaDate = convertToBrasiliaTime(timestamp);
      if (isToday(brasiliaDate)) {
        return 'Hoje';
      } else if (isYesterday(brasiliaDate)) {
        return 'Ontem';
      } else {
        return format(brasiliaDate, 'dd \'de\' MMMM', { locale: ptBR });
      }
    } catch (error) {
      console.error("Error formatting date separator:", error);
      return 'Data inválida';
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach((message) => {
      try {
        const brasiliaDate = convertToBrasiliaTime(message.timestamp);
        const dateKey = format(brasiliaDate, 'yyyy-MM-dd');
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(message);
      } catch (error) {
        console.error("Error grouping message by date:", message, error);
      }
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="text-center space-y-2">
          <div className={cn(
            "animate-spin rounded-full h-6 w-6 border-b-2 mx-auto",
            isDarkMode ? "border-[#fafafa]" : "border-gray-900"
          )}></div>
          <span className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
            Carregando mensagens...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="text-center space-y-2">
          <p className={cn("text-sm text-red-500")}>
            Erro ao carregar mensagens
          </p>
          <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-500")}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!channelId) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 text-center",
        className
      )}>
        <div>
          <p className={cn(
            "text-lg font-medium mb-2",
            isDarkMode ? "text-[#fafafa]" : "text-gray-600"
          )}>
            Selecione um canal para visualizar conversas
          </p>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
          )}>
            Escolha um canal na barra lateral para começar
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 text-center",
        className
      )}>
        <div>
          <p className={cn(
            "text-lg font-medium mb-2",
            isDarkMode ? "text-[#fafafa]" : "text-gray-600"
          )}>
            Selecione uma conversa para visualizar mensagens
          </p>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
          )}>
            {conversationId ? 
              `Não há mensagens para ${conversationId}` : 
              `Escolha uma conversa na lista à esquerda`
            }
          </p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div 
      ref={containerRef}
      className={cn("flex-1 overflow-y-auto", className)}
      style={{ 
        scrollBehavior: 'auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column-reverse' // Inverte a direção para começar de baixo
      }}
    >      
      <div className="space-y-4 p-4">
        {/* Elemento para forçar scroll */}
        <div 
          ref={messagesEndRef} 
          style={{ height: '20px', marginBottom: '20px' }}
          aria-hidden="true"
        />
        
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="space-y-3">
            {/* Separador de data */}
            <div className="flex items-center justify-center my-6 sticky top-2 z-10">
              <div className={cn(
                "px-4 py-2 rounded-full text-xs font-medium shadow-lg backdrop-blur-md border",
                isDarkMode 
                  ? "bg-zinc-800/90 text-zinc-300 border-zinc-700/60" 
                  : "bg-white/95 text-gray-600 border-gray-200/60"
              )}>
                {formatDateSeparator(groupedMessages[dateKey][0].timestamp)}
              </div>
            </div>

            {/* Mensagens do dia */}
            {groupedMessages[dateKey]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map((message, index) => {
              const isAgentMessage = 
                message.tipo_remetente === 'USUARIO_INTERNO' || 
                message.tipo_remetente === 'Yelena-ai' ||
                message.tipo_remetente === 'AGENTE' ||
                message.sender === 'agent';
              
              const contactName = message.Nome_do_contato || message.nome_do_contato || message.contactName;
              const messageType = message.mensagemtype || 'text';
              const isMediaMessage = messageType !== 'text' && messageType !== undefined;
              
              return (
                <div
                  key={`${message.id}-${index}`}
                  className={cn(
                    "flex mb-3",
                    isAgentMessage ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] space-y-1",
                    isAgentMessage ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-3 py-2 text-sm shadow-sm relative",
                      isAgentMessage
                        ? "bg-[#b5103c] text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md"
                        : isDarkMode
                          ? "bg-[#18181b] text-[#fafafa] rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-zinc-800"
                          : "bg-white text-gray-900 rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-gray-200",
                      // Adicionar a "rabinha" do WhatsApp
                      isAgentMessage 
                        ? "after:content-[''] after:absolute after:top-0 after:right-[-8px] after:w-0 after:h-0 after:border-l-[8px] after:border-l-[#b5103c] after:border-t-[8px] after:border-t-transparent"
                        : isDarkMode
                          ? "before:content-[''] before:absolute before:top-0 before:left-[-8px] before:w-0 before:h-0 before:border-r-[8px] before:border-r-[#18181b] before:border-t-[8px] before:border-t-transparent"
                          : "before:content-[''] before:absolute before:top-0 before:left-[-8px] before:w-0 before:h-0 before:border-r-[8px] before:border-r-white before:border-t-[8px] before:border-t-transparent"
                    )}>
                      {isMediaMessage ? (
                        <MediaMessageRenderer
                          content={message.content}
                          messageType={messageType}
                          messageId={message.id}
                          isDarkMode={isDarkMode}
                          balloonColor={isAgentMessage ? 'sent' : 'received'}
                        />
                      ) : (
                        <p className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center space-x-2 text-xs px-1",
                      isAgentMessage ? "flex-row-reverse space-x-reverse" : "flex-row",
                      isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
                    )}>
                      <span className="font-medium">
                        {isAgentMessage ? 'Agente' : contactName || 'Cliente'}
                      </span>
                      <span>{formatMessageTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
