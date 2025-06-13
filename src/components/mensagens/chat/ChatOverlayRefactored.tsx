
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebarFixed } from './ChatSidebarFixed';
import { ChatMainAreaFixed } from './ChatMainAreaFixed';
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

interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
}

export const ChatOverlayRefactored: React.FC<ChatOverlayRefactoredProps> = ({ 
  channelId, 
  isDarkMode, 
  onClose
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, user } = useAuth();
  
  // Use simplified hooks
  const { 
    conversations: simpleConversations, 
    loading: conversationsLoading, 
    refreshConversations 
  } = useSimpleConversations(channelId);
  
  const { 
    messages, 
    loading: messagesLoading
  } = useSimpleMessages(channelId, selectedConversation);

  console.log('🎯 [CHAT_OVERLAY] Current state:', {
    channelId,
    selectedConversation,
    conversationsCount: simpleConversations.length,
    messagesCount: messages.length,
    conversationsLoading,
    messagesLoading,
    isAuthenticated,
    user: user?.name
  });

  // Convert SimpleConversation to UnifiedConversation (compatibility)
  const conversations: Conversation[] = simpleConversations.map(conv => ({
    id: conv.id,
    contact_name: conv.contact_name,
    contact_phone: conv.contact_phone,
    last_message: conv.last_message,
    last_message_time: conv.last_message_time,
    status: conv.status,
    unread_count: conv.unread_count,
    updated_at: conv.updated_at
  }));

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const firstConversation = conversations[0];
      console.log('🎯 [CHAT_OVERLAY] Auto-selecting first conversation:', firstConversation.id);
      setSelectedConversation(firstConversation.id);
    }
  }, [conversations, selectedConversation]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Convert messages to display format
  const displayMessages: SimpleMessage[] = messages.map(msg => ({
    id: msg.id,
    session_id: msg.session_id,
    message: msg.message,
    read_at: msg.read_at,
    tipo_remetente: msg.tipo_remetente,
    nome_do_contato: msg.nome_do_contato,
    mensagemtype: msg.mensagemtype,
    media_base64: msg.media_base64
  }));

  if (conversationsLoading && conversations.length === 0) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
      )}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto"></div>
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
      <ChatSidebarFixed
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

      <ChatMainAreaFixed
        selectedConv={selectedConv || null}
        messages={displayMessages}
        messagesLoading={messagesLoading}
        isDarkMode={isDarkMode}
        channelId={channelId}
        agentName={user?.name}
      />
    </div>
  );
};
