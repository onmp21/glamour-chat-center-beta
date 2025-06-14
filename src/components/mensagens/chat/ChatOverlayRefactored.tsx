import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useSimpleConversations } from '@/hooks/useSimpleConversations';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelConversation } from '@/types/messages'; // Added for selectedConv in ChatMainArea

interface ChatOverlayRefactoredProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSendFile: (file: File, caption?: string) => Promise<void>; // Added
  onSendAudio: (audioBlob: Blob, duration: number) => Promise<void>; // Added
}

// Tipo unificado para compatibilidade
interface UnifiedConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
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
  nome_do_contato?: string;
  mensagemtype?: string;
}

interface Conversation {
  contactName: string;
  contactNumber: string;
}

export const ChatOverlayRefactored: React.FC<ChatOverlayRefactoredProps> = ({
  channelId,
  isDarkMode,
  onClose,
  onSendFile,
  onSendAudio
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {
    isAuthenticated,
    user
  } = useAuth();

  // Usar hooks simplificados
  const {
    conversations: simpleConversations,
    loading: conversationsLoading,
    refreshConversations
  } = useSimpleConversations(channelId);
  const {
    messages,
    loading: messagesLoading,
    sendMessage: sendMessageHook,
    sendFile: sendFileHook,
    sendAudio: sendAudioHook,
    refetch: refetchMessages
  } = useSimpleMessages(channelId, selectedConversation);

  console.log('🎯 [CHAT_OVERLAY] Estado atual:', {
    channelId,
    selectedConversation,
    conversationsCount: simpleConversations.length,
    messagesCount: messages.length,
    conversationsLoading,
    messagesLoading,
    isAuthenticated,
    user: user?.name
  });

  // Converter SimpleConversation para UnifiedConversation (compatibilidade)
  const conversations: UnifiedConversation[] = simpleConversations.map(conv => ({
    id: conv.id,
    contact_name: conv.contact_name,
    contact_phone: conv.contact_phone,
    last_message: conv.last_message,
    last_message_time: conv.last_message_time,
    status: conv.status,
    unread_count: conv.unread_count,
    updated_at: conv.updated_at
  }));

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
    if (selectedConversation) {
      await sendMessageHook(message);
      refetchMessages();
    }
  };

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('📎 [CHAT_OVERLAY] Send file:', file.name);
     if (selectedConversation) {
      await sendFileHook(file, caption);
      refetchMessages();
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('🎵 [CHAT_OVERLAY] Send audio:', duration);
    if (selectedConversation) {
      await sendAudioHook(audioBlob, duration);
      refetchMessages();
    }
  };

  const selectedConvData = simpleConversations.find(c => c.id === selectedConversation);
  const selectedConvForMainArea: ChannelConversation | undefined = selectedConvData ? {
    ...selectedConvData,
    unread_messages: selectedConvData.unread_count, // Mapeando para o tipo esperado
    is_pinned: false, // Adicionando valor padrão
    tags: [], // Adicionando valor padrão
    notes: '', // Adicionando valor padrão
  } : undefined;

  // Converter mensagens para o formato esperado
  const displayMessages: Message[] = messages.map(msg => {
    const isAgent = msg.tipo_remetente === 'USUARIO_INTERNO' || msg.tipo_remetente === 'Yelena-ai' || msg.sender === 'agent';
    return {
      id: msg.id,
      content: msg.message,
      timestamp: msg.created_at, // Assuming created_at is the correct timestamp field
      sender: isAgent ? 'agent' : 'customer',
      tipo_remetente: msg.tipo_remetente,
      type: msg.mensagemtype === 'image' ? 'image' :
            msg.mensagemtype === 'audio' ? 'audio' :
            msg.mensagemtype === 'video' ? 'video' :
            msg.mensagemtype === 'document' ? 'file' : 'text',
      fileUrl: msg.media_url,
      fileName: msg.media_caption || msg.message, // Fallback for file name
      read: msg.is_read !== undefined ? msg.is_read : true, // Default to true if undefined
      nome_do_contato: msg.nome_do_contato,
      mensagemtype: msg.mensagemtype
    };
  });

  // Criar objeto de conversa para o header
  const conversationForHeader: Conversation | null = selectedConvData ? {
    contactName: selectedConvData.contact_name,
    contactNumber: selectedConvData.contact_phone
  } : null;

  if (conversationsLoading && conversations.length === 0) {
    return <div className={cn("fixed inset-0 z-50 flex items-center justify-center", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
        </div>
      </div>;
  }
  return <div className={cn("fixed inset-0 z-50 flex", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      <ChatSidebar 
        channelId={channelId} 
        conversations={conversations} 
        selectedConversation={selectedConversation} 
        isSidebarOpen={isSidebarOpen} 
        isDarkMode={isDarkMode} 
        onClose={onClose} 
        onConversationSelect={handleConversationSelect} // Passado handleConversationSelect
        onSidebarToggle={setIsSidebarOpen} 
        onRefresh={refreshConversations} 
      />

      <div className="flex-1 flex flex-col">
        <ChatMainArea 
          selectedConv={selectedConvForMainArea} // Passado selectedConvForMainArea
          conversationForHeader={conversationForHeader} 
          messages={displayMessages} 
          messagesLoading={messagesLoading} 
          isSidebarOpen={isSidebarOpen} 
          isDarkMode={isDarkMode} 
          channelId={channelId} 
          onSidebarToggle={setIsSidebarOpen} 
          onMarkAsResolved={() => { console.log('Mark as resolved clicked'); }} // Implementar lógica de resolução
          onSendMessage={handleSendMessage} 
          onSendFile={handleSendFile} // Passado handleSendFile
          onSendAudio={handleSendAudio} // Passado handleSendAudio
        />
      </div>
    </div>;
};
