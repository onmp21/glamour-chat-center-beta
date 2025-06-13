import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, MoreVertical } from 'lucide-react';
import { ConversationHeader } from '../ConversationHeader';
import { ChatInput } from '../ChatInput';
// Importar o novo componente otimizado
import { OptimizedMessageList } from '../OptimizedMessageList';

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
  // displayMessages: Message[]; // Removido, OptimizedMessageList gerencia
  // messagesLoading: boolean; // Removido, OptimizedMessageList gerencia
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  channelId?: string;
  onSidebarToggle: (open: boolean) => void;
  onMarkAsResolved: () => void;
  onSendMessage: (message: string) => void;
  onSendFile: (file: File, caption?: string) => void;
  onSendAudio: (audioBlob: Blob, duration: number) => void;
}

export const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  selectedConv,
  conversationForHeader,
  // displayMessages, // Removido
  // messagesLoading, // Removido
  isSidebarOpen,
  isDarkMode,
  channelId,
  onSidebarToggle,
  onMarkAsResolved,
  onSendMessage,
  onSendFile,
  onSendAudio
}) => {
  // Referência para o contêiner de mensagens (ainda pode ser útil para o ChatInput)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const scrollAreaRef = useRef<HTMLDivElement>(null); // Removido, ScrollArea está dentro de OptimizedMessageList
  
  // Função para rolar para o final das mensagens (ainda pode ser útil para o ChatInput)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // useEffect para rolar para o final removido, pois OptimizedMessageList gerencia

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

  // renderMessage function removida, OptimizedMessageList renderiza as mensagens

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
      
      {/* Messages - Usando OptimizedMessageList */}
      {channelId && selectedConv.id && (
        <OptimizedMessageList
          channel={channelId}
          sessionId={selectedConv.id}
        />
      )}
      
      {/* Input */}
      <ChatInput 
        isDarkMode={isDarkMode} 
        onSendMessage={(message) => {
          onSendMessage(message);
          // Rolar para o final após enviar uma mensagem
          setTimeout(scrollToBottom, 300);
        }}
        onSendFile={onSendFile}
        onSendAudio={onSendAudio}
      />
    </>
  );
};


