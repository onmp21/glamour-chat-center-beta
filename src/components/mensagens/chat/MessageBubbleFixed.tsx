
import React from 'react';
import { cn } from '@/lib/utils';
import { MediaRendererFixed } from '@/components/chat/MediaRendererFixed';

interface SimpleMessage {
  id: string;
  session_id: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  media_base64?: string;
}

interface MessageBubbleFixedProps {
  message: SimpleMessage;
  isDarkMode: boolean;
  showSenderName?: boolean;
  agentName?: string;
}

export const MessageBubbleFixed: React.FC<MessageBubbleFixedProps> = ({
  message,
  isDarkMode,
  showSenderName = true,
  agentName
}) => {
  const isAgent = message.tipo_remetente === 'USUARIO_INTERNO' || 
                  message.tipo_remetente === 'Yelena-ai' ||
                  message.tipo_remetente === 'Andressa-ai';
  
  const isMedia = message.media_base64 || 
                  (message.mensagemtype && message.mensagemtype !== 'text') ||
                  message.message.startsWith('data:') ||
                  (message.message.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(message.message.replace(/\s/g, '')));

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const getSenderName = () => {
    if (isAgent) {
      if (message.tipo_remetente === 'Yelena-ai') return 'Yelena AI';
      if (message.tipo_remetente === 'Andressa-ai') return 'Andressa AI';
      return agentName || 'Agente';
    }
    return message.nome_do_contato || 'Cliente';
  };

  const contentToRender = message.media_base64 || message.message;

  return (
    <div className={cn(
      "flex mb-4",
      isAgent ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] space-y-1",
        isAgent ? "items-end" : "items-start"
      )}>
        {/* Sender name */}
        {showSenderName && (
          <div className={cn(
            "text-xs font-medium px-1",
            isAgent ? "text-right" : "text-left",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {getSenderName()}
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          "px-3 py-2 rounded-lg shadow-sm",
          isAgent
            ? "bg-[#b5103c] text-white"
            : isDarkMode
              ? "bg-[#27272a] text-white border border-[#3f3f46]"
              : "bg-white text-gray-900 border border-gray-200"
        )}>
          {isMedia ? (
            <MediaRendererFixed
              content={contentToRender}
              messageType={message.mensagemtype}
              messageId={message.id}
              isDarkMode={isDarkMode}
              balloonColor={isAgent ? 'sent' : 'received'}
            />
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.message}
            </p>
          )}
        </div>

        {/* Time and sender info */}
        <div className={cn(
          "flex items-center text-xs px-1",
          isAgent ? "flex-row-reverse space-x-reverse space-x-2" : "flex-row space-x-2",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )}>
          <span>{formatTime(message.read_at)}</span>
          {isAgent && agentName && (
            <span className="font-medium">• {agentName}</span>
          )}
        </div>
      </div>
    </div>
  );
};
