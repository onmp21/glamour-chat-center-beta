
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { MediaRendererFixed } from './MediaRendererFixed';

interface SimpleMessageHistoryProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  className?: string;
}

const truncateName = (name: string = ''): string => {
  const parts = (name || '').split(' ').filter(Boolean);
  return parts.slice(0, 2).join(' ') || name || 'Cliente';
};

export const SimpleMessageHistory: React.FC<SimpleMessageHistoryProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { messages, loading, error } = useSimpleMessages(channelId, conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // CORRIGIDO: Função melhorada para detectar mídia com prioridade para media_url
  const isMediaMessage = (message: any) => {
    // PRIORIDADE 1: media_url (link curto)
    if (message.media_url && message.media_url.trim() !== '') {
      return true;
    }
    
    // PRIORIDADE 2: media_base64
    if (message.media_base64 && message.media_base64.trim() !== '') {
      return true;
    }

    // PRIORIDADE 3: mensagemtype não texto
    if (message.mensagemtype && 
        !['text', 'conversation'].includes(message.mensagemtype)) {
      return true;
    }

    return false;
  };

  // CORRIGIDO: Função para obter conteúdo da mídia com prioridade para media_url
  const getMediaContent = (message: any): string => {
    // PRIORIDADE 1: media_url
    if (message.media_url && message.media_url.trim() !== '') {
      return message.media_url;
    }

    // PRIORIDADE 2: media_base64
    if (message.media_base64 && message.media_base64.trim() !== '') {
      return message.media_base64;
    }

    // FALLBACK: message se parecer mídia
    if (message.message && 
        (message.message.startsWith('data:') || 
         message.message.startsWith('http'))) {
      return message.message;
    }

    return '';
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-2">
          <div className={cn(
            "animate-spin rounded-full h-6 w-6 border-b-2 mx-auto",
            isDarkMode ? "border-white" : "border-gray-900"
          )}></div>
          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Carregando mensagens...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-red-500">
          <p>Erro ao carregar mensagens</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className={cn("text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
          <div className="text-4xl mb-4">💬</div>
          <p>Nenhuma mensagem encontrada</p>
          <p className="text-sm mt-1">Esta conversa ainda não possui mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isAgent = message.tipo_remetente === 'USUARIO_INTERNO' || message.tipo_remetente === 'Yelena-ai';
          const contactName = message.nome_do_contato || 'Cliente';
          const isMedia = isMediaMessage(message);

          const hora = new Date(message.read_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const nomeExibido = truncateName(contactName);

          return (
            <div
              key={`${message.id}-${index}`}
              className={cn(
                "flex mb-3",
                isAgent ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] space-y-1",
                isAgent ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 text-sm shadow-sm rounded-lg",
                  isAgent
                    ? "bg-[#b5103c] text-white"
                    : isDarkMode
                      ? "bg-[#18181b] text-white border border-zinc-800"
                      : "bg-white text-gray-900 border border-gray-200"
                )}>
                  {isMedia ? (
                    <MediaRendererFixed 
                      content={getMediaContent(message)}
                      messageType={message.mensagemtype || 'text'}
                      messageId={message.id?.toString?.() || String(message.id)}
                      fileName={
                        (message.media_url && !message.media_url.startsWith('data:') ? 'Arquivo' 
                          : (message.message && message.message.length < 60 ? message.message : undefined)
                        ) || undefined
                      }
                      isDarkMode={isDarkMode}
                      balloonColor={isAgent ? 'sent' : 'received'}
                    />
                  ) : (
                    <p className="break-words whitespace-pre-wrap">
                      {message.message}
                    </p>
                  )}
                </div>

                <div className={cn(
                  "flex items-center space-x-2 text-xs px-1",
                  isAgent ? "flex-row-reverse space-x-reverse" : "flex-row",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  <span>
                    {channelId === "chat" || channelId.includes("yelena") ? "Yelena AI" : 
                     channelId.includes("canarana") ? "Canarana" :
                     channelId.includes("souto") ? "Souto Soares" :
                     channelId.includes("joao") ? "João Dourado" :
                     channelId.includes("america") ? "América Dourada" :
                     channelId.includes("gerente-lojas") ? "Gerente Lojas" :
                     channelId.includes("gerente-externo") ? "Gerente Externo" : "Canal"}
                  </span>
                  <span className="font-medium">
                    {isAgent ? 'Agente' : nomeExibido}
                  </span>
                  <span>
                    {hora}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
