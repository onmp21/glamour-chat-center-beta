
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { MediaRenderer } from './MediaRenderer';
import { MediaMigrationService } from '@/services/MediaMigrationService';

interface SimpleMessageHistoryProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  className?: string;
}

export const SimpleMessageHistory: React.FC<SimpleMessageHistoryProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { messages, loading, error } = useSimpleMessages(channelId, conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para o final
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Função melhorada para detectar se é mídia
  const isMediaMessage = (message: any) => {
    // Priorizar verificação de media_base64
    if (message.media_base64) {
      return MediaMigrationService.isBase64Content(message.media_base64) || 
             MediaMigrationService.isStorageUrl(message.media_base64);
    }

    // Verificar mensagemtype
    if (message.mensagemtype && 
        message.mensagemtype !== 'text' && 
        message.mensagemtype !== 'conversation') {
      return true;
    }

    // Verificar campo message
    if (message.message) {
      if (MediaMigrationService.isStorageUrl(message.message)) {
        return true;
      }
      
      if (message.message.startsWith('data:') || 
          MediaMigrationService.isBase64Content(message.message)) {
        return true;
      }
    }

    return false;
  };

  // Função para obter conteúdo da mídia
  const getMediaContent = (message: any): string => {
    // Priorizar media_base64
    if (message.media_base64) {
      return message.media_base64;
    }

    // Usar message se for mídia
    if (message.message && 
        (MediaMigrationService.isStorageUrl(message.message) || 
         message.message.startsWith('data:') ||
         MediaMigrationService.isBase64Content(message.message))) {
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
                    <MediaRenderer 
                      content={getMediaContent(message)}
                      messageType={message.mensagemtype || 'text'}
                      messageId={message.id}
                      channelId={channelId}
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
                  <span className="font-medium">
                    {isAgent ? 'Agente' : contactName}
                  </span>
                  <span>
                    {new Date(message.read_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
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
