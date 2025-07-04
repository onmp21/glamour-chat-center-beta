import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { YelenaMessageDisplay } from './YelenaMessageDisplay';
import { AndressaMessageDisplay } from './AndressaMessageDisplay';
import { JoaoDouradoMessageDisplay } from './JoaoDouradoMessageDisplay';
import { AmericaDouradaMessageDisplay } from './AmericaDouradaMessageDisplay';
import { GerenteLojasMessageDisplay } from './GerenteLojasMessageDisplay';
import { GerenteExternoMessageDisplay } from './GerenteExternoMessageDisplay';
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
  userName?: string; // Nome do usuário que enviou a mensagem (se aplicável)
}

// Mapeamento de canais para nomes amigáveis
const getChannelDisplayName = (channelId?: string): string => {
  const channelNames: Record<string, string> = {
    'chat': 'Yelena AI',
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Yelena AI',
    'joao-dourado': 'João Dourado',
    'america-dourada': 'América Dourada',
    'gerente-lojas': 'Gerente Lojas',
    'gerente-externo': 'Gerente Externo',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'Gerente Externo',
    'canarana': 'Canarana',
    'souto-soares': 'Souto Soares',
    'yelena': 'Yelena AI'
  };
  
  return channelNames[channelId || ''] || 'Canal Desconhecido';
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isDarkMode, 
  channelId,
  userName 
}) => {
  const channelName = getChannelDisplayName(channelId);

  // Se for canal Yelena, usar o YelenaMessageDisplay
  if (channelId === 'chat' || channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
    return (
      <YelenaMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode}
        channelName={channelName}
        userName={userName}
      />
    );
  }

  // Se for canal João Dourado, usar o JoaoDouradoMessageDisplay
  if (channelId === 'joao-dourado') {
    return (
      <JoaoDouradoMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode}
        channelName={channelName}
        userName={userName}
      />
    );
  }

  // Se for canal América Dourada, usar o AmericaDouradaMessageDisplay
  if (channelId === 'america-dourada') {
    return (
      <AmericaDouradaMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode}
        channelName={channelName}
        userName={userName}
      />
    );
  }

  // Se for canal Gerente Lojas, usar o GerenteLojasMessageDisplay
  if (channelId === 'gerente-lojas') {
    return (
      <GerenteLojasMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode}
        channelName={channelName}
        userName={userName}
      />
    );
  }

  // Se for canal Andressa (gerente-externo), usar o AndressaMessageDisplay ou GerenteExternoMessageDisplay
  if (channelId === 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7' || channelId === 'gerente-externo') {
    return (
      <GerenteExternoMessageDisplay 
        message={message} 
        isDarkMode={isDarkMode}
        channelName={channelName}
        userName={userName}
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
    <MessageBubble 
      message={chatMessage} 
      isDarkMode={isDarkMode}
      channelName={channelName}
      userName={userName}
    >
      <MessageContent message={chatMessage} isDarkMode={isDarkMode} />
    </MessageBubble>
  );
};

