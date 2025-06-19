
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

  // CORRIGIDO: Função simplificada para detectar agentes vs clientes
  const isAgentMessage = (message: any): boolean => {
    // CORREÇÃO: Verificar apenas tipo_remetente conforme especificado
    const isInternal = message.tipo_remetente === 'CONTATO_INTERNO';
    console.log(`🤖 [AGENT_CHECK] Mensagem ${message.id}: tipo_remetente=${message.tipo_remetente}, isInternal=${isInternal}`);
    return isInternal;
  };

  const isMediaMessage = (message: any): boolean => {
    // CORREÇÃO: Verificar se mensagem contém "media(" E tem media_url
    if (message.message && message.message.includes('media(') && message.media_url) {
      console.log(`📄 [MEDIA_CHECK] Mídia detectada - message: ${message.message.substring(0, 50)}, media_url: ${message.media_url.substring(0, 50)}`);
      return true;
    }

    // Verificar se tem media_url diretamente (mesmo sem "media(" na mensagem)
    if (message.media_url && message.media_url.trim() !== '') {
      console.log(`🔗 [MEDIA_CHECK] Mídia detectada via media_url: ${message.media_url.substring(0, 50)}`);
      return true;
    }

    // Verificar tipo de mensagem não texto
    if (message.mensagemtype && !['text', 'conversation'].includes(message.mensagemtype)) {
      console.log(`🎭 [MEDIA_CHECK] Mídia detectada via mensagemtype: ${message.mensagemtype}`);
      return true;
    }

    return false;
  };

  const getMediaContent = (message: any): string => {
    // CORREÇÃO: Priorizar sempre media_url
    if (message.media_url && message.media_url.trim() !== '') {
      console.log(`🔗 [MEDIA_CONTENT] Usando media_url: ${message.media_url.substring(0, 50)}`);
      return message.media_url;
    }

    // Fallback: message se parecer mídia
    if (message.message && 
        (message.message.startsWith('data:') || 
         message.message.startsWith('http'))) {
      console.log(`📄 [MEDIA_CONTENT] Usando message como fallback: ${message.message.substring(0, 50)}`);
      return message.message;
    }

    console.log(`❌ [MEDIA_CONTENT] Nenhum conteúdo de mídia encontrado para mensagem ${message.id}`);
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
          const isAgent = isAgentMessage(message); // USAR FUNÇÃO CORRIGIDA
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
                isAgent ? "justify-end" : "justify-start" // CORREÇÃO: CONTATO_INTERNO = DIREITA, CONTATO_EXTERNO = ESQUERDA
              )}
            >
              <div className={cn(
                "max-w-[85%] space-y-1",
                isAgent ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 text-sm shadow-sm rounded-lg",
                  isAgent
                    ? "bg-[#b5103c] text-white" // INTERNO = DIREITA = VERMELHO
                    : isDarkMode
                      ? "bg-[#18181b] text-white border border-zinc-800" // EXTERNO = ESQUERDA = ESCURO
                      : "bg-white text-gray-900 border border-gray-200" // EXTERNO = ESQUERDA = CLARO
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
                      balloonColor={isAgent ? 'sent' : 'received'} // CORREÇÃO: balloonColor baseado no tipo correto
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
