
import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { useLazyChannelMessages } from '@/hooks/useLazyChannelMessages';
import { cn } from '@/lib/utils';

interface MessageHistoryProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  className?: string;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { messages, loading, error, refreshMessages } = useLazyChannelMessages(channelId, conversationId);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh a cada 30 segundos se não há erro
  useEffect(() => {
    if (!autoRefresh || error) return;
    
    const interval = setInterval(() => {
      console.log('🔄 [MESSAGE_HISTORY] Auto-refreshing messages');
      refreshMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, error, refreshMessages]);

  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (messages.length > 0) {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        className
      )}>
        <div className={cn(
          "flex flex-col items-center space-y-2",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
          <p className="text-sm">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        className
      )}>
        <div className={cn(
          "flex flex-col items-center space-y-4 p-4",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          <div className="text-red-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-medium">Erro ao carregar mensagens</p>
            <p className="text-sm opacity-70 mt-1">{error}</p>
            <button
              onClick={() => {
                setAutoRefresh(true);
                refreshMessages();
              }}
              className="mt-3 px-4 py-2 bg-[#b5103c] text-white rounded hover:bg-[#9d0e34] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        className
      )}>
        <div className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )}>
          <div className="text-4xl mb-4">💬</div>
          <p>Nenhuma mensagem encontrada</p>
          <p className="text-sm mt-1">Esta conversa ainda não possui mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 p-4">
        {loading && messages.length > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#b5103c]"></div>
              <span>Atualizando mensagens...</span>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => {
          // Converter RawMessage para o formato esperado pelo ChatMessage
          const chatMessage = {
            id: message.id,
            content: message.content || message.message,
            timestamp: message.timestamp || message.read_at || new Date().toISOString(),
            sender: message.sender,
            tipo_remetente: message.tipo_remetente,
            Nome_do_contato: message.Nome_do_contato,
            nome_do_contato: message.nome_do_contato,
            mensagemtype: message.mensagemtype
          };

          return (
            <ChatMessage
              key={`${message.id}-${index}`}
              message={chatMessage}
              isDarkMode={isDarkMode}
              channelId={channelId}
            />
          );
        })}
        
        {/* Spacer para scroll automático */}
        <div className="h-1" />
      </div>
    </ScrollArea>
  );
};
