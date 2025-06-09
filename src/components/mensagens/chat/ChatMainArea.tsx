
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, MoreVertical } from 'lucide-react';
import { ConversationHeader } from '../ConversationHeader';
import { ChatInput } from '../ChatInput';
import { MediaMessageRenderer } from '@/components/chat/MediaMessageRenderer';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  tipo_remetente?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
  Nome_do_contato?: string;
  mensagemtype?: string;
}

interface Conversation {
  contactName: string;
  contactNumber: string;
}

interface ChatMainAreaProps {
  selectedConv: any;
  conversationForHeader: Conversation | null;
  displayMessages: Message[];
  messagesLoading: boolean;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  channelId?: string;
  onSidebarToggle: (open: boolean) => void;
  onMarkAsResolved: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  selectedConv,
  conversationForHeader,
  displayMessages,
  messagesLoading,
  isSidebarOpen,
  isDarkMode,
  channelId,
  onSidebarToggle,
  onMarkAsResolved,
  onSendMessage
}) => {
  // Referência para o contêiner de mensagens
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Função para rolar para o final das mensagens
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Rolar para o final quando as mensagens mudarem ou quando a conversa for selecionada
  useEffect(() => {
    if (!messagesLoading) {
      // Pequeno atraso para garantir que o DOM foi atualizado
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [displayMessages, messagesLoading, selectedConv]);

  if (!selectedConv || !conversationForHeader) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className={cn("text-gray-500", isDarkMode ? "text-gray-400" : "text-gray-600")}>
          Selecione uma conversa para começar
        </p>
      </div>
    );
  }

  const handleMenuClick = () => {
    console.log('⋮ Menu button clicked');
    alert('Menu de opções em desenvolvimento');
  };

  const renderMessage = (message: Message) => {
    const isAgentMessage = message.sender === 'agent';
    
    // Verificar se é mídia usando a mesma lógica de todos os canais
    const isMediaMessage = 
      (message.mensagemtype && message.mensagemtype !== 'text') ||
      message.content.startsWith('data:') ||
      (message.content.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(message.content.replace(/\s/g, '')));
    
    return (
      <div
        key={message.id}
        className={cn(
          "chat-message-whatsapp message-animate",
          isAgentMessage ? "sent" : "received"
        )}
      >
        {/* Nome do contato para mensagens recebidas */}
        {!isAgentMessage && message.Nome_do_contato && (
          <div className="chat-message-sender" style={{ color: isDarkMode ? '#e9edef' : '#303030' }}>
            {message.Nome_do_contato}
          </div>
        )}
        
        {/* Conteúdo da mensagem */}
        <div>
          {isMediaMessage ? (
            <MediaMessageRenderer
              content={message.content}
              messageType={message.mensagemtype || 'text'}
              messageId={message.id}
              isDarkMode={isDarkMode}
            />
          ) : (
            <p className="chat-message-text break-words">{message.content}</p>
          )}
        </div>
        
        {/* Timestamp */}
        <div className="chat-message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        {!isSidebarOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onSidebarToggle(true)}
            className="ml-2"
          >
            <Menu size={20} />
          </Button>
        )}
        <div className="flex-1">
          <ConversationHeader
            conversation={conversationForHeader}
            isDarkMode={isDarkMode}
            onMarkAsResolved={onMarkAsResolved}
          />
        </div>
        <div className="flex items-center gap-2 pr-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAsResolved}
            className={cn(
              "flex items-center gap-2",
              isDarkMode ? "border-[#3f3f46] hover:bg-[#27272a]" : "border-gray-200 hover:bg-gray-50"
            )}
          >
            Resolver
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenuClick}
            className={cn(
              isDarkMode ? "hover:bg-[#27272a]" : "hover:bg-gray-50"
            )}
          >
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messagesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b5103c]"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {displayMessages.map(renderMessage)}
            {/* Elemento invisível no final para rolar até ele */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Input */}
      <ChatInput 
        isDarkMode={isDarkMode} 
        onSendMessage={(message) => {
          onSendMessage(message);
          // Rolar para o final após enviar uma mensagem
          setTimeout(scrollToBottom, 300);
        }}
      />
    </>
  );
};
