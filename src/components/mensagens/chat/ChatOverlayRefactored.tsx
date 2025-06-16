import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useSimpleConversations } from '@/hooks/useSimpleConversations';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelConversation } from '@/types/messages';
import { useConversationStatus } from '@/hooks/useConversationStatus';

interface ChatOverlayRefactoredProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSendFile?: (file: File, caption?: string) => Promise<void>;
  onSendAudio?: (audioBlob: Blob, duration: number) => Promise<void>;
}

// Placeholder type definition for SimpleConversation as it's not exported from the hook
// and the hook file is not in the allowed list to modify.
export interface SimpleConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
  // Add any other properties that useSimpleConversations might return for a conversation
}

// Placeholder type definition for SimpleMessage
export interface SimpleMessage {
  id: string;
  message: string;
  tipo_remetente?: string; // e.g., 'USUARIO_INTERNO', 'CONTATO_EXTERNO'
  created_at?: string; // Timestamp
  read_at?: string; // Timestamp for read status
  mensagemtype?: string; // e.g., 'text', 'image', 'audio'
  media_url?: string;
  media_caption?: string;
  is_read?: boolean;
  nome_do_contato?: string;
  // Add other properties returned by useSimpleMessages for a message
}


// Unified type for compatibility, if still needed
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

// Type for messages displayed in ChatMainArea
interface DisplayMessage {
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

interface ConversationForHeader {
  contactName: string;
  contactNumber: string;
}

export const ChatOverlayRefactored: React.FC<ChatOverlayRefactoredProps> = ({
  channelId,
  isDarkMode,
  onClose,
  onSendFile: onSendFileProp, 
  onSendAudio: onSendAudioProp
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const {
    conversations: simpleConversations, // This is SimpleConversation[]
    loading: conversationsLoading,
    refreshConversations
  } = useSimpleConversations(channelId);
  
  // The useSimpleMessages hook provides messages, loading, error, and refreshMessages.
  // It does NOT provide sendMessage, sendFile, sendAudio, or refetch directly based on previous errors.
  // Those sending actions are expected to be passed to ChatMainArea or handled by ChatInput via useMessageActions.
  const {
    messages: simpleMessagesFromHook, // This is SimpleMessage[]
    loading: messagesLoading,
    refreshMessages 
  } = useSimpleMessages(channelId, selectedConversation);

  console.log('🎯 [CHAT_OVERLAY] Estado atual:', {
    channelId,
    selectedConversation,
    conversationsCount: simpleConversations.length,
    messagesCount: simpleMessagesFromHook.length,
    conversationsLoading,
    messagesLoading,
    isAuthenticated,
    user: user?.name
  });

  // Cast simpleConversations to UnifiedConversation[] if structure matches.
  // Ensure SimpleConversation has all needed fields for UnifiedConversation.
  const conversations: UnifiedConversation[] = simpleConversations.map((conv: SimpleConversation) => ({
    id: conv.id,
    contact_name: conv.contact_name,
    contact_phone: conv.contact_phone,
    last_message: conv.last_message,
    last_message_time: conv.last_message_time,
    status: conv.status,
    unread_count: conv.unread_count,
    updated_at: conv.updated_at
  }));

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

  // Message sending is typically handled by ChatInput via useMessageActions or passed directly to ChatMainArea.
  // These handlers here are illustrative if ChatOverlayRefactored itself were to send messages,
  // but based on the setup, ChatMainArea / ChatInput handle sends.
  const handleSendMessage = async (message: string) => {
    console.log('💬 [CHAT_OVERLAY] Attempting to send message:', message);
    if (selectedConversation) {
      // This component relies on ChatInput/useMessageActions for sending.
      // This function is passed to ChatMainArea, which might pass it to its ChatInput.
      // If `useSimpleMessages` were to provide `sendMessage`, it would be called here.
      console.warn("ChatOverlayRefactored.handleSendMessage: Sending logic should be in ChatInput or via a dedicated sending hook.");
      if (refreshMessages) {
        await refreshMessages(); // Refresh after send attempt (actual send is elsewhere)
      }
    }
  };

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('📎 [CHAT_OVERLAY] Attempting to send file:', file.name);
     if (selectedConversation) {
      console.warn("ChatOverlayRefactored.handleSendFile: Sending logic should be in ChatInput or via a dedicated sending hook.");
      if (refreshMessages) {
        await refreshMessages();
      }
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('🎵 [CHAT_OVERLAY] Attempting to send audio:', duration);
    if (selectedConversation) {
      console.warn("ChatOverlayRefactored.handleSendAudio: Sending logic should be in ChatInput or via a dedicated sending hook.");
      if (refreshMessages) {
        await refreshMessages();
      }
    }
  };

  const selectedConvData: SimpleConversation | undefined = simpleConversations.find(c => c.id === selectedConversation);
  
  // Map SimpleConversation to ChannelConversation for ChatMainArea
  const selectedConvForMainArea: ChannelConversation | undefined = selectedConvData ? {
    id: selectedConvData.id,
    contact_name: selectedConvData.contact_name,
    contact_phone: selectedConvData.contact_phone,
    last_message: selectedConvData.last_message,
    last_message_time: selectedConvData.last_message_time,
    status: selectedConvData.status,
    updated_at: selectedConvData.updated_at,
    unread_count: selectedConvData.unread_count,
    // Ensure other required fields for ChannelConversation are added if not in SimpleConversation
    // For example, if ChannelConversation requires these:
    // is_pinned: false, // Removed as it caused an error; add to type if needed
    // tags: [], 
    // notes: '', 
    // name: selectedConvData.contact_name, 
    // lastMessage: selectedConvData.last_message, 
    // lastMessageTimestamp: selectedConvData.last_message_time, 
    // avatarUrl: '', 
    // type: 'whatsapp', 
  } : undefined;

  const { updateConversationStatus } = useConversationStatus();

  const handleMarkAsResolved = async () => {
    if (selectedConversation && channelId) {
      // Chama o hook normal
      await updateConversationStatus(channelId, selectedConversation, 'resolved');
      // Opcional: refresh conversations/messages
      refreshConversations && (await refreshConversations());
      refreshMessages && (await refreshMessages());
    }
  };

  // Convert SimpleMessage from hook to DisplayMessage for ChatMainArea
  const displayMessages: DisplayMessage[] = simpleMessagesFromHook.map((msg: SimpleMessage) => {
    const isAgent = msg.tipo_remetente === 'USUARIO_INTERNO' || msg.tipo_remetente === 'Yelena-ai';
    
    return {
      id: msg.id,
      content: msg.message || '',
      timestamp: msg.created_at || msg.read_at || new Date().toISOString(), // Use created_at or read_at
      sender: isAgent ? 'agent' : 'customer', // This assumes SimpleMessage has a way to determine sender
      tipo_remetente: msg.tipo_remetente,
      type: msg.mensagemtype === 'image' ? 'image' :
            msg.mensagemtype === 'audio' ? 'audio' :
            msg.mensagemtype === 'video' ? 'video' :
            msg.mensagemtype === 'document' || msg.mensagemtype === 'file' ? 'file' : 'text', // Added 'file' for document
      fileUrl: msg.media_url || undefined,
      fileName: msg.media_caption || msg.message || undefined,
      read: typeof msg.is_read === 'boolean' ? msg.is_read : true,
      nome_do_contato: msg.nome_do_contato,
      mensagemtype: msg.mensagemtype
    };
  });

  const conversationForHeader: ConversationForHeader | null = selectedConvData ? {
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

  return (
    <div className={cn("fixed inset-0 z-50 flex", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      <ChatSidebar 
        channelId={channelId} 
        conversations={conversations} // This is UnifiedConversation[]
        selectedConversation={selectedConversation} 
        isSidebarOpen={isSidebarOpen} 
        isDarkMode={isDarkMode} 
        onClose={onClose} 
        onConversationSelect={handleConversationSelect}
        onSidebarToggle={setIsSidebarOpen} 
        onRefresh={refreshConversations} 
      />

      <div className="flex-1 flex flex-col">
        <ChatMainArea 
          selectedConv={selectedConvForMainArea} 
          conversationForHeader={conversationForHeader} 
          messages={displayMessages} 
          messagesLoading={messagesLoading} 
          isSidebarOpen={isSidebarOpen} 
          isDarkMode={isDarkMode} 
          channelId={channelId} 
          onSidebarToggle={setIsSidebarOpen} 
          onMarkAsResolved={handleMarkAsResolved}
          onSendMessage={handleSendMessage} 
          onSendFile={onSendFileProp || handleSendFile} 
          onSendAudio={onSendAudioProp || handleSendAudio} 
        />
      </div>
    </div>
  );
};
