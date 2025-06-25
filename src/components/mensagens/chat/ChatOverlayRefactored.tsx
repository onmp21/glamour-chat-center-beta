import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useNonRealtimeConversations } from '@/hooks/useNonRealtimeConversations';
import { useNonRealtimeMessages } from '@/hooks/useNonRealtimeMessages';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelConversation } from '@/types/messages';
import { useConversationStatus } from '@/hooks/useConversationStatus';
import { useMessageNotificationManager } from '@/hooks/useMessageNotificationManager';

interface ChatOverlayRefactoredProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSendFile?: (file: File, caption?: string) => Promise<void>;
  onSendAudio?: (audioBlob: Blob, duration: number) => Promise<void>;
}

export interface SimpleConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
}

export interface SimpleMessage {
  id: string;
  message: string;
  tipo_remetente?: string; 
  created_at?: string; 
  read_at?: string; 
  mensagemtype?: string; 
  is_read?: boolean;
  nome_do_contato?: string;
}

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
  message?: string;
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
    conversations: simpleConversations, 
    loading: conversationsLoading,
    error: conversationsError,
    refreshConversations
  } = useNonRealtimeConversations(channelId);
  
  const {
    messages: simpleMessagesFromHook, 
    loading: messagesLoading,
    error: messagesError,
    refreshMessages 
  } = useNonRealtimeMessages(channelId, selectedConversation);

  console.log('🎯 [CHAT_OVERLAY] Estado atual:', {
    channelId,
    selectedConversation,
    conversationsCount: simpleConversations.length,
    messagesCount: simpleMessagesFromHook.length,
    conversationsLoading,
    messagesLoading,
    conversationsError,
    messagesError,
    isAuthenticated,
    user: user?.name
  });

  // Log detalhado das conversas para debug
  useEffect(() => {
    if (simpleConversations.length > 0) {
      console.log('📋 [CHAT_OVERLAY] Conversas carregadas:', simpleConversations.map(conv => ({
        id: conv.id,
        name: conv.contact_name,
        lastMessage: conv.last_message.substring(0, 30) + '...',
        unreadCount: conv.unread_count,
        status: conv.status
      })));
    }
  }, [simpleConversations]);

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

  const handleConversationSelect = (conversationId: string) => {
    console.log('📱 [CHAT_OVERLAY] Conversation selected:', conversationId);
    setSelectedConversation(conversationId);
  };

  const handleSendMessage = async (message: string) => {
    console.log('💬 [CHAT_OVERLAY] Attempting to send message:', message);
    if (selectedConversation) {
      console.warn("ChatOverlayRefactored.handleSendMessage: Sending logic should be in ChatInput or via a dedicated sending hook.");
      if (refreshMessages) {
        await refreshMessages(); 
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
  
  const selectedConvForMainArea: ChannelConversation | undefined = selectedConvData ? {
    id: selectedConvData.id,
    contact_name: selectedConvData.contact_name,
    contact_phone: selectedConvData.contact_phone,
    last_message: selectedConvData.last_message,
    last_message_time: selectedConvData.last_message_time,
    status: selectedConvData.status,
    updated_at: selectedConvData.updated_at,
    unread_count: selectedConvData.unread_count,
  } : undefined;

  const { updateConversationStatus } = useConversationStatus();

  const handleMarkAsResolved = async () => {
    if (selectedConversation && channelId) {
      console.log('🔄 [CHAT_OVERLAY] Marcando conversa como resolvida:', selectedConversation);
      
      const success = await updateConversationStatus(channelId, selectedConversation, 'resolved');
      
      if (success) {
        console.log('✅ [CHAT_OVERLAY] Conversa marcada como resolvida, atualizando listas');
        
        // Forçar refresh das conversas e mensagens
        if (refreshConversations) {
          await refreshConversations();
        }
        if (refreshMessages) {
          await refreshMessages();
        }
        
        // Pequeno delay para garantir que o refresh seja processado
        setTimeout(() => {
          console.log('🔄 [CHAT_OVERLAY] Refresh completado');
        }, 500);
      } else {
        console.error('❌ [CHAT_OVERLAY] Falha ao marcar conversa como resolvida');
      }
    }
  };

  const displayMessages: DisplayMessage[] = simpleMessagesFromHook.map((msg: SimpleMessage) => {
    const isAgent = msg.tipo_remetente === 'USUARIO_INTERNO' || 
                   msg.tipo_remetente === 'Yelena-ai' ||
                   msg.tipo_remetente === 'Andressa-ai' ||
                   msg.tipo_remetente === 'Gustavo-ai';
    
    // Detectar se é mídia baseado no conteúdo da mensagem ou tipo
    const isMediaMessage = msg.mensagemtype && msg.mensagemtype !== 'text';
    const messageContent = msg.message || '';
    
    return {
      id: msg.id,
      content: messageContent,
      timestamp: msg.created_at || msg.read_at || new Date().toISOString(), 
      sender: isAgent ? 'agent' : 'customer', 
      tipo_remetente: msg.tipo_remetente,
      type: msg.mensagemtype === 'image' ? 'image' :
            msg.mensagemtype === 'audio' ? 'audio' :
            msg.mensagemtype === 'video' ? 'video' :
            msg.mensagemtype === 'document' || msg.mensagemtype === 'file' ? 'file' : 'text', 
      fileUrl: isMediaMessage ? messageContent : undefined, // Usar o conteúdo da mensagem como URL se for mídia
      fileName: isMediaMessage ? 'Arquivo' : undefined,
      read: typeof msg.is_read === 'boolean' ? msg.is_read : true,
      nome_do_contato: msg.nome_do_contato,
      mensagemtype: msg.mensagemtype,
      message: msg.message
    };
  });

  const { resetNotificationState } = useMessageNotificationManager({
    messages: selectedConversation ? displayMessages : [],
    isOverlayOpen: !!selectedConversation,
    enabled: !!selectedConversation
  });

  useEffect(() => {
    if (selectedConversation) {
      resetNotificationState();
    }
  }, [selectedConversation, resetNotificationState]);

  const conversationForHeader: ConversationForHeader | null = selectedConvData ? {
    contactName: selectedConvData.contact_name,
    contactNumber: selectedConvData.contact_phone
  } : null;

  // Mostrar erro se houver problema no carregamento
  if (conversationsError) {
    return (
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
        <div className="text-center space-y-2">
          <p className="text-red-500">Erro ao carregar conversas</p>
          <p className="text-sm text-gray-500">{conversationsError}</p>
          <button 
            onClick={() => refreshConversations && refreshConversations()}
            className="bg-[#b5103c] text-white px-4 py-2 rounded hover:bg-[#9d0e34]"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (conversationsLoading && conversations.length === 0) {
    return (
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
          <p className="text-sm text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
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
          onMarkAsResolved={handleMarkAsResolved}
          onSendMessage={async (message: string) => {
            console.log('💬 [CHAT_OVERLAY] Message sending handled by ChatInput');
            if (refreshMessages) await refreshMessages();
          }} 
          onSendFile={onSendFileProp || (async (file: File, caption?: string) => {
            console.log('📎 [CHAT_OVERLAY] File sending handled by ChatInput');
            if (refreshMessages) await refreshMessages();
          })} 
          onSendAudio={onSendAudioProp || (async (audioBlob: Blob, duration: number) => {
            console.log('🎵 [CHAT_OVERLAY] Audio sending handled by ChatInput');
            if (refreshMessages) await refreshMessages();
          })} 
        />
      </div>
    </div>
  );
};
