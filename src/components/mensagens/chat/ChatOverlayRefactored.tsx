import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';
import { useChannelMessagesRefactored } from '@/hooks/useChannelMessagesRefactored';

interface ChatOverlayRefactoredProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

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

export const ChatOverlayRefactored: React.FC<ChatOverlayRefactoredProps> = ({
  channelId,
  isDarkMode,
  onClose
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  console.log("🐛 [ChatOverlayRefactored] Renderizando. isSidebarOpen:", isSidebarOpen, "selectedConversation:", selectedConversation, "channelId recebido (props):", channelId);
  
  const { conversations, loading: conversationsLoading, error: conversationsError, refreshConversations } = useChannelConversationsRefactored(channelId);
  console.log("🐛 [ChatOverlayRefactored] Passando channelId para useChannelMessagesRefactored:", channelId);
  const { messages, loading: messagesLoading, error: messagesError, sendMessage, sendFile, sendAudio } = useChannelMessagesRefactored(channelId, selectedConversation || "");

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const firstConversation = conversations[0];
      console.log('🎯 [CHAT_OVERLAY] Auto-selecting first conversation:', firstConversation.id);
      setSelectedConversation(firstConversation.id);
    } else if (!selectedConversation) {
      // Fallback para garantir que uma conversa seja selecionada para renderização
      console.log('🎯 [CHAT_OVERLAY] No conversations found, selecting a mock conversation for rendering.');
      setSelectedConversation('1'); // Seleciona a primeira conversa mockada
    }
  }, [conversations, selectedConversation]);

  const handleConversationSelect = (conversationId: string) => {
    console.log('📱 [CHAT_OVERLAY] Conversation selected:', conversationId);
    setSelectedConversation(conversationId);
  };

  const handleMarkAsResolved = () => {
    if (selectedConversation) {
      console.log('✅ [CHAT_OVERLAY] Marking conversation as resolved:', selectedConversation);
      // Interface visual apenas - sem funcionalidade real
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedConversation || !message.trim()) return;
    await sendMessage(message);
  };

  const handleSendFile = async (file: File, caption?: string) => {
    if (!selectedConversation) return;
    await sendFile(file, caption);
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation) return;
    await sendAudio(audioBlob, duration);
  };

  const handleRefreshConversations = () => {
    refreshConversations();
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Process messages for display
  const displayMessages: Message[] = messages.map(msg => {
    let sender: 'customer' | 'agent';
    
    // Diferenciação específica para canal Andressa e outros canais
    if (channelId === 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7' || channelId === 'gerente-externo') {
      // Canal Andressa - usar tipo_remetente para diferenciar
      if (msg.tipo_remetente === 'USUARIO_INTERNO') {
        sender = 'agent'; // Mensagem da Andressa
      } else {
        sender = 'customer'; // Mensagem do cliente
      }
    } else if (channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
      // Canal Yelena (usando UUID)
      if (msg.tipo_remetente === 'Yelena-ai' || msg.tipo_remetente === 'USUARIO_INTERNO') {
        sender = 'agent';
      } else {
        sender = 'customer';
      }
    } else if (channelId === 'chat') {
      // Canal Yelena (usando nome legado)
      if (msg.tipo_remetente === 'Yelena-ai' || msg.tipo_remetente === 'USUARIO_INTERNO') {
        sender = 'agent';
      } else {
        sender = 'customer';
      }
    } else {
      // Outros canais - usar lógica existente
      if (msg.tipo_remetente) {
        if (msg.tipo_remetente === 'USUARIO_INTERNO') {
          sender = 'agent';
        } else {
          sender = 'customer';
        }
      } else {
        sender = msg.sender === 'agent' ? 'agent' : 'customer';
      }
    }
    
    console.log(`💬 [MESSAGE_PROCESSING] Channel: ${channelId}, Message ${msg.id}: tipo_remetente="${msg.tipo_remetente}", mensagemtype="${msg.mensagemtype}", determined sender="${sender}"`);
    
    return {
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      sender,
      tipo_remetente: msg.tipo_remetente,
      type: 'text',
      read: true,
      Nome_do_contato: msg.Nome_do_contato,
      mensagemtype: msg.mensagemtype
    };
  });

  // Create conversation object with correct property names for header
  const conversationForHeader: Conversation | null = selectedConv ? {
    contactName: selectedConv.contact_name,
    contactNumber: selectedConv.contact_phone
  } : null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      <ChatSidebar
        channelId={channelId}
        conversations={conversations}
        selectedConversation={selectedConversation}
        isSidebarOpen={isSidebarOpen}
        isDarkMode={isDarkMode}
        onClose={onClose}
        onConversationSelect={handleConversationSelect}
        onSidebarToggle={setIsSidebarOpen}
        onRefresh={handleRefreshConversations}
      />

      <div className="flex-1 flex flex-col">
        <ChatMainArea
          selectedConv={selectedConv}
          conversationForHeader={conversationForHeader}
          messages={displayMessages}
          messagesLoading={false}
          isSidebarOpen={isSidebarOpen}
          isDarkMode={isDarkMode}
          channelId={channelId}
          onSidebarToggle={setIsSidebarOpen}
          onMarkAsResolved={handleMarkAsResolved}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

