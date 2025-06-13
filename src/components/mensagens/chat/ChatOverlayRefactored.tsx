
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useLazyConversationsList } from '@/hooks/useLazyConversationsList';
import { useLazyChannelMessages } from '@/hooks/useLazyChannelMessages';
import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useMessageSenderExtended } from '@/hooks/useMessageSenderExtended';

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
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  
  // Usar hooks otimizados
  const { 
    conversations, 
    loading: conversationsLoading, 
    refreshConversations 
  } = useLazyConversationsList(channelId);
  
  const { 
    messages, 
    loading: messagesLoading,
    addMessage 
  } = useLazyChannelMessages(channelId, selectedConversation || undefined);
  
  const { getConversationStatus, updateConversationStatus, markConversationAsViewed } = useConversationStatusEnhanced();
  const { playNotificationSound } = useNotificationSound();
  const { sendMessage: sendAppMessage } = useMessageSenderExtended();

  // Auto-select first conversation and mark as viewed
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const firstConversation = conversations[0];
      console.log('🎯 [CHAT_OVERLAY] Auto-selecting first conversation:', firstConversation.id);
      setSelectedConversation(firstConversation.id);
      markConversationAsViewed(channelId, firstConversation.id);
    }
  }, [conversations, selectedConversation, channelId, markConversationAsViewed]);

  // Mark conversation as viewed when selected
  useEffect(() => {
    if (selectedConversation) {
      console.log('👁️ [CHAT_OVERLAY] Marking conversation as viewed:', selectedConversation);
      markConversationAsViewed(channelId, selectedConversation);
    }
  }, [selectedConversation, channelId, markConversationAsViewed]);

  // Play notification sound when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && previousMessageCount > 0 && messages.length > previousMessageCount) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'customer') {
        console.log('🔊 [CHAT_OVERLAY] Playing notification sound for new customer message');
        playNotificationSound();
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages, previousMessageCount, playNotificationSound]);

  // Auto-refresh conversations (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedConversation) {
        console.log('🔄 [CHAT_OVERLAY] Auto-refreshing conversations (no active chat)');
        refreshConversations();
      }
    }, 120000); // 2 minutos

    return () => clearInterval(interval);
  }, [refreshConversations, selectedConversation]);

  const handleConversationSelect = (conversationId: string) => {
    console.log('📱 [CHAT_OVERLAY] Conversation selected:', conversationId);
    setSelectedConversation(conversationId);
    markConversationAsViewed(channelId, conversationId);
  };

  const handleMarkAsResolved = () => {
    if (selectedConversation) {
      console.log('✅ [CHAT_OVERLAY] Marking conversation as resolved:', selectedConversation);
      updateConversationStatus(channelId, selectedConversation, 'resolved');
      
      setTimeout(() => {
        refreshConversations();
      }, 500);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedConversation || !message.trim()) return;
    
    const currentStatus = getConversationStatus(channelId, selectedConversation);
    if (currentStatus === "unread") {
      updateConversationStatus(channelId, selectedConversation, "in_progress", false);
    }

    const success = await sendAppMessage({
      conversationId: selectedConversation,
      channelId: channelId,
      content: message,
      sender: "agent",
      messageType: "text",
    }, addMessage);

    if (!success) {
      console.error("❌ [CHAT_OVERLAY] Failed to send message");
    }
  };

  const handleSendFile = async (file: File, caption?: string) => {
    if (!selectedConversation) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        const messageType = file.type.startsWith("image/") ? "image" : 
                          file.type.startsWith("video/") ? "video" : 
                          file.type.startsWith("audio/") ? "audio" : "file";

        const success = await sendAppMessage({
          conversationId: selectedConversation,
          channelId: channelId,
          content: caption || "",
          sender: "agent",
          messageType: messageType,
          fileData: {
            base64: base64Content.split(',')[1],
            mimeType: file.type,
            fileName: file.name,
          },
        }, addMessage);

        if (success) {
          console.log("✅ [CHAT_OVERLAY] File sent successfully:", file.name);
        } else {
          console.error("❌ [CHAT_OVERLAY] Failed to send file:", file.name);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("❌ [CHAT_OVERLAY] Error sending file:", error);
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        
        const success = await sendAppMessage({
          conversationId: selectedConversation,
          channelId: channelId,
          content: "",
          sender: "agent",
          messageType: "audio",
          fileData: {
            base64: base64Content.split(',')[1],
            mimeType: audioBlob.type,
            fileName: `audio_message_${Date.now()}.webm`,
            duration: duration,
          },
        }, addMessage);

        if (success) {
          console.log("✅ [CHAT_OVERLAY] Audio sent successfully");
        } else {
          console.error("❌ [CHAT_OVERLAY] Failed to send audio");
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("❌ [CHAT_OVERLAY] Error sending audio:", error);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Create display messages with proper sender determination
  const displayMessages: Message[] = messages.map(msg => {
    let sender: 'customer' | 'agent';
    
    if (channelId === 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7' || channelId === 'gerente-externo') {
      sender = msg.tipo_remetente === 'USUARIO_INTERNO' ? 'agent' : 'customer';
    } else if (channelId === 'chat' || channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
      sender = (msg.tipo_remetente === 'Yelena-ai' || msg.tipo_remetente === 'USUARIO_INTERNO') ? 'agent' : 'customer';
    } else {
      sender = msg.tipo_remetente === 'USUARIO_INTERNO' ? 'agent' : 'customer';
    }
    
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

  // Create conversation object for header
  const conversationForHeader: Conversation | null = selectedConv ? {
    contactName: selectedConv.contact_name,
    contactNumber: selectedConv.contact_phone
  } : null;

  if (conversationsLoading) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
      )}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
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
          onMarkAsResolved={handleMarkAsResolved}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onSendAudio={handleSendAudio}
        />
      </div>
    </div>
  );
};
