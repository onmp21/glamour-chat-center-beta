
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { YelenaMessageDisplay } from './YelenaMessageDisplay';
import { AndressaMessageDisplay } from './AndressaMessageDisplay';
import { MessageBubble } from './message/MessageBubble';
import { MessageContent } from './message/MessageContent';
import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
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
  };
  isDarkMode: boolean;
  channelId?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isDarkMode, 
  channelId 
}) => {
  // Se for canal Yelena, usar o YelenaMessageDisplay
  if (channelId === 'chat' || channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
    return (
      <YelenaMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode} 
      />
    );
  }

  // Se for canal Andressa (gerente-externo), usar o AndressaMessageDisplay
  if (channelId === 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7' || channelId === 'gerente-externo') {
    return (
      <AndressaMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode} 
      />
    );
  }

  // Converter para o tipo ChatMessage
  const isAgent = 
    message.tipo_remetente === 'USUARIO_INTERNO' || 
    message.tipo_remetente === 'Yelena-ai' ||
    message.tipo_remetente === 'AGENTE' ||
    message.sender === 'agent' || 
    message.isOwn;
  
  const displayName = isAgent 
    ? (message.agentName || 'Agente') 
    : (message.Nome_do_contato || message.nome_do_contato || message.sender || 'Cliente');

  const chatMessage: ChatMessageType = {
    id: message.id,
    content: message.content,
    timestamp: message.timestamp,
    sender: {
      id: message.sender,
      name: displayName,
      type: isAgent ? 'agent' : 'customer'
    },
    messageType: (message.mensagemtype as any) || 'text',
    isOwn: isAgent
  };

  return (
    <MessageBubble message={chatMessage} isDarkMode={isDarkMode}>
      <MessageContent message={chatMessage} isDarkMode={isDarkMode} />
    </MessageBubble>
  );
};
