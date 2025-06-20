import React from 'react';
import { cn } from '@/lib/utils';
import { MediaMessageRenderer } from './MediaMessageRenderer';

interface MessageDisplayProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    sender: string;
    tipo_remetente?: string;
    isOwn?: boolean;
    agentName?: string;
    Nome_do_contato?: string;
    nome_do_contato?: string;
    mensagemtype?: string;
    media_url?: string;
  };
  isDarkMode: boolean;
  channelName?: string;
  userName?: string;
}

export const AndressaMessageDisplay: React.FC<MessageDisplayProps> = ({ 
  message, 
  isDarkMode,
  channelName = 'Andressa',
  userName
}) => {
  // Verificar se é usuário interno ou externo
  const isInternalUser = message.tipo_remetente === 'CONTATO_INTERNO';
  const isExternalContact = message.tipo_remetente === 'CONTATO_EXTERNO';
  
  // Determinar se é agente baseado no tipo de remetente
  const isAgent = isInternalUser || message.sender === 'agent' || message.isOwn;

  // Nome do remetente
  let displayName = '';
  if (isInternalUser) {
    // Para usuários internos, mostrar o nome do canal
    displayName = channelName;
  } else if (isExternalContact) {
    // Para contatos externos, mostrar o nome do contato
    displayName = message.Nome_do_contato || message.nome_do_contato || message.sender || 'Cliente';
  } else {
    // Fallback para compatibilidade
    displayName = isAgent 
      ? (message.agentName || channelName) 
      : (message.Nome_do_contato || message.nome_do_contato || message.sender || 'Cliente');
  }

  const renderMessageContent = () => {
    // Verificar se é mensagem de mídia
    const isMediaMessage = message.mensagemtype && message.mensagemtype !== 'text';
    const hasMediaUrl = message.media_url && message.media_url.trim() !== '';
    
    // Se o conteúdo indica mídia (ex: "media( ver coluna media_url)")
    const isMediaContent = message.content && message.content.includes('media(');
    
    if (isMediaMessage || hasMediaUrl || isMediaContent) {
      // Se temos media_url, usar ela; senão usar o content
      const mediaContent = hasMediaUrl ? message.media_url : message.content;
      
      return (
        <MediaMessageRenderer
          content={mediaContent}
          messageType={message.mensagemtype || 'image'}
          messageId={message.id}
          isDarkMode={isDarkMode}
          balloonColor={isAgent ? 'sent' : 'received'}
        />
      );
    }
    
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <div className={cn(
      "chat-message-whatsapp message-animate",
      isAgent ? "sent" : "received"
    )}>
      <div className="chat-message-header">
        <div className="channel-name">
          📱 {channelName}
        </div>
        {!isAgent && (
          <div className="chat-message-sender">
            👤 {displayName}
          </div>
        )}
        {isAgent && isInternalUser && (
          <div className="user-indicator">
            ✏️ Enviado por: {displayName}
          </div>
        )}
      </div>
      <div className="chat-message-content">
        {renderMessageContent()}
      </div>
      <div className="chat-message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
        {isAgent && (
          <span className="checkmark">✓✓</span>
        )}
      </div>
    </div>
  );
};

