
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { ChatMessage } from './ChatMessage';

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
      return message.nome_do_contato || message.Nome_do_contato || 'Cliente';
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
    <div className={cn("space-y-4 pb-4", className)}>
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
              "flex",
              isAgent ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[70%] space-y-1",
              isAgent ? "items-end" : "items-start"
            )}>
              {/* Nome do remetente */}
              {showSenderName && (
                <div className={cn(
                  "text-xs font-medium px-1",
                  isAgent ? "text-right" : "text-left",
                  isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                )}>
                  {senderName}
                </div>
              )}
              
              {/* Balão da mensagem */}
              <div className={cn(
                "relative px-4 py-2 rounded-lg shadow-sm",
                isAgent
                  ? "bg-[#b5103c] text-white rounded-br-none"
                  : (isDarkMode ? "bg-[#27272a] text-white border border-[#3f3f46]" : "bg-gray-100 text-gray-900 border border-gray-200") + " rounded-bl-none"
              )}>
                {/* Conteúdo da mensagem */}
                <div className="text-sm break-words">
                  <ChatMessage
                    message={{
                      id: message.id,
                      content: message.message,
                      timestamp: message.read_at,
                      sender: isAgent ? 'agent' : 'customer',
                      tipo_remetente: message.tipo_remetente,
                      isOwn: isAgent,
                      agentName: senderName,
                      Nome_do_contato: message.Nome_do_contato,
                      nome_do_contato: message.nome_do_contato,
                      mensagemtype: message.mensagemtype
                    }}
                    isDarkMode={isDarkMode}
                    channelId={channelId}
                  />
                </div>
                
                {/* Hora da mensagem */}
                <div className={cn(
                  "text-[10px] mt-1 text-right",
                  isAgent ? "text-red-100" : (isDarkMode ? "text-[#a1a1aa]" : "text-gray-500")
                )}>
                  {formatTime(message.read_at)}
                  {isAgent && (
                    <span className="ml-1">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Elemento para scroll automático */}
      <div ref={messagesEndRef} />
    </div>
  );
};
