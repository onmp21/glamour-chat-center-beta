
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading } = useSimpleMessages(channelId, conversationId);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Função para determinar se deve mostrar nome do remetente
  const shouldShowSenderName = (message: any, index: number) => {
    if (index === 0) return true;
    
    const previousMessage = messages[index - 1];
    return previousMessage.tipo_remetente !== message.tipo_remetente;
  };

  // Função para formatar nome do remetente
  const getSenderName = (message: any) => {
    const isAgent = message.tipo_remetente === 'USUARIO_INTERNO' || 
                   message.tipo_remetente === 'Yelena-ai' ||
                   message.tipo_remetente === 'Andressa-ai';
    
    if (isAgent) {
      return message.tipo_remetente === 'Yelena-ai' ? 'Yelena' :
             message.tipo_remetente === 'Andressa-ai' ? 'Andressa' :
             'Agente';
    } else {
      return message.nome_do_contato || 'Cliente';
    }
  };

  // Função para formatar hora sem segundos
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        className
      )}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto"></div>
          <p className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
            Carregando mensagens...
          </p>
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
        <div className="text-center">
          <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
            Nenhuma mensagem encontrada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("chat-messages-container h-full overflow-y-auto", className)}>
      <div className="chat-messages-wrapper">
        {messages.map((message, index) => {
          const isAgent = message.tipo_remetente === 'USUARIO_INTERNO' || 
                         message.tipo_remetente === 'Yelena-ai' ||
                         message.tipo_remetente === 'Andressa-ai';
          
          const showSenderName = shouldShowSenderName(message, index);
          const senderName = getSenderName(message);

          return (
            <div 
              key={message.id} 
              className={cn(
                "chat-message-row",
                isAgent ? "sent" : "received"
              )}
            >
              {/* Nome do remetente apenas se for necessário */}
              {showSenderName && !isAgent && (
                <div className="chat-message-sender">
                  {senderName}
                </div>
              )}
              
              {/* Balão da mensagem - SEM COMPONENTE ANINHADO */}
              <div className={cn(
                "chat-message-whatsapp",
                isAgent ? "sent" : "received"
              )}>
                <div className="chat-message-text">
                  {message.message}
                </div>
                
                <div className="chat-message-timestamp">
                  {formatTime(message.read_at)}
                  {isAgent && <span className="checkmark">✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Elemento para scroll automático */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
