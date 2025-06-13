
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useChannelConversationsRefactored } from '@/hooks/useChannelConversationsRefactored';
import { useChannelMessagesRefactored } from '@/hooks/useChannelMessagesRefactored';
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

// Helper function to convert File/Blob to Base64
const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const ChatOverlayRefactored: React.FC<ChatOverlayRefactoredProps> = ({ 
  channelId, 
  isDarkMode, 
  onClose
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  
  const { conversations, loading: conversationsLoading, refreshConversations } = useChannelConversationsRefactored(channelId);
  const { messages, loading: messagesLoading } = useChannelMessagesRefactored(channelId, selectedConversation || undefined);
  const { getConversationStatus, updateConversationStatus, markConversationAsViewed } = useConversationStatusEnhanced();
  const { playNotificationSound } = useNotificationSound();
  const { sendMessage: sendAppMessage } = useMessageSenderExtended();

  const handleSendFile = async (file: File, caption?: string) => {
    if (!selectedConversation) return;

    try {
      const base64Content = await fileToBase64(file);
      const messageType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document";

      const success = await sendAppMessage({
        conversationId: selectedConversation,
        channelId: channelId,
        content: caption || "",
        sender: "agent",
        messageType: messageType,
        fileData: {
          base64: base64Content,
          mimeType: file.type,
          fileName: file.name,
        },
      });

      if (success) {
        console.log("✅ [CHAT_OVERLAY] Arquivo enviado com sucesso:", file.name);
      } else {
        console.error("❌ [CHAT_OVERLAY] Falha ao enviar arquivo:", file.name);
      }
    } catch (error) {
      console.error("❌ [CHAT_OVERLAY] Erro ao converter arquivo para base64 ou enviar:", error);
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation) return;

    try {
      const base64Content = await fileToBase64(audioBlob);
      const success = await sendAppMessage({
        conversationId: selectedConversation,
        channelId: channelId,
        content: "", // Áudio não tem conteúdo de texto direto
        sender: "agent",
        messageType: "audio",
        fileData: {
          base64: base64Content,
          mimeType: audioBlob.type,
          fileName: `audio_message_${Date.now()}.webm`,
          duration: duration,
        },
      });

      if (success) {
        console.log("✅ [CHAT_OVERLAY] Áudio enviado com sucesso:", `audio_message_${Date.now()}.webm`);
      } else {
        console.error("❌ [CHAT_OVERLAY] Falha ao enviar áudio:", `audio_message_${Date.now()}.webm`);
      }
    } catch (error) {
      console.error("❌ [CHAT_OVERLAY] Erro ao converter áudio para base64 ou enviar:", error);
    }
  };

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
      // Only play sound for customer messages (not our own)
      if (lastMessage.sender === 'customer') {
        console.log('🔊 [CHAT_OVERLAY] Playing notification sound for new customer message');
        playNotificationSound();
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages, previousMessageCount, playNotificationSound]);

  // CORREÇÃO: Reduzir auto-refresh para 2 minutos e só se não houver conversa selecionada
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedConversation) {
        console.log('🔄 [CHAT_OVERLAY] Auto-refreshing conversations (no active chat)');
        refreshConversations();
      }
    }, 120000); // 2 minutos em vez de 30 segundos

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
      sender: "agent", // Assumindo que a mensagem é enviada pelo agente
      messageType: "text",
    });

    if (success) {
      // Opcional: Limpar o input da mensagem após o envio bem-sucedido
      // setMessage(""); 
    } else {
      console.error("❌ [CHAT_OVERLAY] Falha ao enviar mensagem pelo aplicativo.");
    }
  };

  const handleRefreshConversations = () => {
    console.log('🔄 [CHAT_OVERLAY] Manual refresh conversations triggered');
    refreshConversations();
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // ... keep existing code (displayMessages mapping logic)
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
    } else if (channelId === 'chat' || channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
      // Canal Yelena
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
        onConversationSelect={handleConversationSelect}
        onSidebarToggle={setIsSidebarOpen}
        onRefresh={handleRefreshConversations}
      />

      <div className="flex-1 flex flex-col">
        <ChatMainArea
          selectedConv={selectedConv}
          conversationForHeader={conversationForHeader}
          displayMessages={displayMessages}
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


