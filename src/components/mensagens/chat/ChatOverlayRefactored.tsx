
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useSimpleConversations } from '@/hooks/useSimpleConversations';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { useAuth } from '@/contexts/AuthContext';

interface ChatOverlayRefactoredProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSendFile: (file: File, caption?: string) => void;
  onSendAudio: (audioBlob: Blob, duration: number) => void;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  tipo_remetente?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
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
  const { isAuthenticated, user } = useAuth();
  
  // Usar hooks simplificados
  const { 
    conversations, 
    loading: conversationsLoading, 
    refreshConversations 
  } = useSimpleConversations(channelId);
  
  const { 
    messages, 
    loading: messagesLoading
  } = useSimpleMessages(channelId, selectedConversation);

  console.log('🎯 [CHAT_OVERLAY] Estado atual:', {
    channelId,
    selectedConversation,
    conversationsCount: conversations.length,
    messagesCount: messages.length,
    conversationsLoading,
    messagesLoading,
    isAuthenticated,
    user: user?.name
  });

  // Auto-select primeira conversa
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const firstConversation = conversations[0];
      console.log('🎯 [CHAT_OVERLAY] Auto-selecting first conversation:', firstConversation.id);
      setSelectedConversation(firstConversation.id);
    }
  }, [conversations, selectedConversation]);

  const handleConversationSelect = (conversationId: string) => {
    console.log('📱 [CHAT_OVERLAY] Conversation selected:', conversationId);
    setSelectedConversation(conversationId);
  };

  const handleSendMessage = async (message: string) => {
    console.log('💬 [CHAT_OVERLAY] Send message:', message);
    // TODO: Implementar envio de mensagem
  };

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('📎 [CHAT_OVERLAY] Send file:', file.name);
    // TODO: Implementar envio de arquivo
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('🎵 [CHAT_OVERLAY] Send audio:', duration);
    // TODO: Implementar envio de áudio
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Converter mensagens para o formato esperado
  const displayMessages: Message[] = messages.map(msg => {
    const isAgent = msg.tipo_remetente === 'USUARIO_INTERNO' || msg.tipo_remetente === 'Yelena-ai';
    
    return {
      id: msg.id,
      content: msg.message,
      timestamp: msg.read_at,
      sender: isAgent ? 'agent' : 'customer',
      tipo_remetente: msg.tipo_remetente,
      type: 'text',
      read: true,
      Nome_do_contato: msg.Nome_do_contato,
      mensagemtype: msg.mensagemtype
    };
  });

  // Criar objeto de conversa para o header
  const conversationForHeader: Conversation | null = selectedConv ? {
    contactName: selectedConv.contact_name,
    contactNumber: selectedConv.contact_phone
  } : null;

  if (conversationsLoading && conversations.length === 0) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
      )}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
          <p className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
            Carregando conversas...
          </p>
        </div>
      </div>
    );
  }

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
        onConversationSelect={setSelectedConversation}
        onSidebarToggle={setIsSidebarOpen}
        onRefresh={refreshConversations}
      />

      <div className="flex-1 flex flex-col">
        <ChatMainArea
          selectedConv={selectedConv}
          conversationForHeader={conversationForHeader}
          messages={displayMessages}
          messagesLoading={messagesLoading}
          isSidebarOpen={isSidebarOpen}
          isDarkMode={isDarkMode}
          channelId={channelId}
          onSidebarToggle={setIsSidebarOpen}
          onMarkAsResolved={() => {}}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onSendAudio={handleSendAudio}
        />
      </div>
    </div>
  );
};
