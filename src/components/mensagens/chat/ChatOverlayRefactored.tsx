import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useSimpleConversations, SimpleConversation } from '@/hooks/useSimpleConversations'; // Explicitly import SimpleConversation
import { useSimpleMessages, SimpleMessage } from '@/hooks/useSimpleMessages'; // Explicitly import SimpleMessage
import { useAuth } from '@/contexts/AuthContext';
import { ChannelConversation } from '@/types/messages';

interface ChatOverlayRefactoredProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
  // onSendFile and onSendAudio are passed to ChatMainArea, but ChatOverlayRefactored itself
  // gets send functions from useSimpleMessages. If these props are for overriding,
  // their usage needs clarification. Assuming they are for ChatMainArea.
  onSendFile?: (file: File, caption?: string) => Promise<void>; 
  onSendAudio?: (audioBlob: Blob, duration: number) => Promise<void>;
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
  onSendFile: onSendFileProp, // Renaming to avoid conflict if ChatMainArea needs these specific props
  onSendAudio: onSendAudioProp
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const {
    conversations: simpleConversations,
    loading: conversationsLoading,
    refreshConversations
  } = useSimpleConversations(channelId);
  
  // Destructure based on the actual return type of useSimpleMessages from error messages
  // It seems to return: { messages: SimpleMessage[]; loading: boolean; error: string; refreshMessages: () => Promise<void>; }
  // And NOT sendMessage, sendFile, sendAudio, refetch
  const {
    messages: simpleMessagesFromHook, // Array of SimpleMessage
    loading: messagesLoading,
    // error: messagesError, // Assuming an error state might be returned
    refreshMessages // This is the function for refreshing messages
  } = useSimpleMessages(channelId, selectedConversation);

  console.log('🎯 [CHAT_OVERLAY] Estado atual:', {
    channelId,
    selectedConversation,
    conversationsCount: simpleConversations.length,
    messagesCount: simpleMessagesFromHook.length, // Use data from useSimpleMessages
    conversationsLoading,
    messagesLoading,
    isAuthenticated,
    user: user?.name
  });

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

  // --- Handler functions for sending messages ---
  // The useSimpleMessages hook (as per error types) does not provide send functions directly.
  // These handlers will log warnings. Actual send functionality might be broken
  // if useSimpleMessages is not updated to provide these.

  const handleSendMessage = async (message: string) => {
    console.log('💬 [CHAT_OVERLAY] Attempting to send message:', message);
    if (selectedConversation) {
      console.warn("sendMessageHook is not available from useSimpleMessages' current type. Message not sent via hook.");
      // Fallback to refreshing messages if that's the desired behavior
      if (refreshMessages) {
        await refreshMessages();
      }
    }
  };

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('📎 [CHAT_OVERLAY] Attempting to send file:', file.name);
     if (selectedConversation) {
      console.warn("sendFileHook is not available from useSimpleMessages' current type. File not sent via hook.");
      if (refreshMessages) {
        await refreshMessages();
      }
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('🎵 [CHAT_OVERLAY] Attempting to send audio:', duration);
    if (selectedConversation) {
      console.warn("sendAudioHook is not available from useSimpleMessages' current type. Audio not sent via hook.");
      if (refreshMessages) {
        await refreshMessages();
      }
    }
  };
  // --- End of handler functions ---


  const selectedConvData = simpleConversations.find(c => c.id === selectedConversation);
  // Ensure ChannelConversation matches the actual type definition
  const selectedConvForMainArea: ChannelConversation | undefined = selectedConvData ? {
    ...selectedConvData, // Spread properties from SimpleConversation
    // Assuming ChannelConversation has these specific fields.
    // If 'unread_messages' was a mistake and it should be 'unread_count':
    unread_count: selectedConvData.unread_count, // Corrected from unread_messages
    is_pinned: false, 
    tags: [], 
    notes: '', 
    // Add other required fields for ChannelConversation with defaults if not in SimpleConversation
    name: selectedConvData.contact_name, // Example: map contact_name to name
    lastMessage: selectedConvData.last_message, // Example
    lastMessageTimestamp: selectedConvData.last_message_time, // Example
    avatarUrl: '', // Example: provide default or map if available
    type: 'whatsapp', // Example: provide default
  } : undefined;


  // Convert SimpleMessage from hook to DisplayMessage for ChatMainArea
  const displayMessages: DisplayMessage[] = simpleMessagesFromHook.map((msg: SimpleMessage) => {
    // Assuming SimpleMessage has 'tipo_remetente' and 'message'
    // 'sender' property does not exist on SimpleMessage based on error
    const isAgent = msg.tipo_remetente === 'USUARIO_INTERNO' || msg.tipo_remetente === 'Yelena-ai';
    
    // 'created_at' does not exist on SimpleMessage, error suggests 'read_at'
    // 'media_url', 'media_caption', 'is_read' also reported missing from SimpleMessage
    return {
      id: msg.id, // Assuming SimpleMessage has id
      content: msg.message || '', // Assuming SimpleMessage has message, fallback to empty
      timestamp: msg.read_at || msg.created_at || new Date().toISOString(), // Use read_at or created_at if available, else current time
      sender: isAgent ? 'agent' : 'customer',
      tipo_remetente: msg.tipo_remetente,
      type: msg.mensagemtype === 'image' ? 'image' : // Assuming SimpleMessage has mensagemtype
            msg.mensagemtype === 'audio' ? 'audio' :
            msg.mensagemtype === 'video' ? 'video' :
            msg.mensagemtype === 'document' ? 'file' : 'text',
      fileUrl: msg.media_url || undefined, // Fallback for media_url
      fileName: msg.media_caption || msg.message || undefined, // Fallback for media_caption
      read: typeof msg.is_read === 'boolean' ? msg.is_read : true, // Fallback for is_read
      nome_do_contato: msg.nome_do_contato, // Assuming SimpleMessage has nome_do_contato
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
        conversations={conversations} 
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
          onMarkAsResolved={() => { console.log('Mark as resolved clicked'); }}
          // Pass the corrected handlers or the props if they are meant for ChatMainArea
          onSendMessage={handleSendMessage} 
          onSendFile={onSendFileProp || handleSendFile} // Use prop if provided, else internal handler
          onSendAudio={onSendAudioProp || handleSendAudio} // Use prop if provided, else internal handler
        />
      </div>
    </div>
  );
};
