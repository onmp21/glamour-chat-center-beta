
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import { useSimpleConversations } from '@/hooks/useSimpleConversations';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useBase64Migration } from '@/hooks/useBase64Migration';
import { toast } from 'sonner';

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
  nome_do_contato?: string;
  mensagemtype?: string;
}

interface Conversation {
  contactName: string;
  contactNumber: string;
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

export const ChatOverlayRefactored: React.FC<ChatOverlayRefactoredProps> = ({ 
  channelId, 
  isDarkMode, 
  onClose
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, user } = useAuth();
  
  // Hook para migração de base64
  const { hasPending, migrateAllTables, isLoading: migrationLoading } = useBase64Migration();
  
  // Usar hooks simplificados
  const { 
    conversations: simpleConversations, 
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
    conversationsCount: simpleConversations.length,
    messagesCount: messages.length,
    conversationsLoading,
    messagesLoading,
    isAuthenticated,
    user: user?.name,
    hasPending,
    migrationLoading
  });

  // Migração automática em background se há base64 pendente
  useEffect(() => {
    if (hasPending && !migrationLoading) {
      console.log('🔄 [CHAT_OVERLAY] Starting background base64 migration');
      
      // Executar migração em background
      setTimeout(async () => {
        try {
          const result = await migrateAllTables();
          if (result.success) {
            console.log('✅ [CHAT_OVERLAY] Background migration completed successfully');
            // Refresh conversations após migração
            refreshConversations();
          } else {
            console.error('❌ [CHAT_OVERLAY] Background migration failed');
          }
        } catch (error) {
          console.error('❌ [CHAT_OVERLAY] Background migration error:', error);
        }
      }, 2000); // Aguardar 2 segundos para não afetar o carregamento inicial
    }
  }, [hasPending, migrationLoading, migrateAllTables, refreshConversations]);

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
    toast.info('Envio de mensagem será implementado em breve');
  };

  const handleSendFile = async (file: File, caption?: string) => {
    console.log('📎 [CHAT_OVERLAY] Send file:', file.name);
    toast.info('Envio de arquivo será implementado em breve');
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('🎵 [CHAT_OVERLAY] Send audio:', duration);
    toast.info('Envio de áudio será implementado em breve');
  };

  const handleMarkAsResolved = () => {
    if (selectedConversation) {
      console.log('✅ [CHAT_OVERLAY] Mark as resolved:', selectedConversation);
      toast.success('Conversa marcada como resolvida');
    }
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
      nome_do_contato: msg.nome_do_contato,
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
          {hasPending && (
            <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Processando mídias em background...
            </p>
          )}
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
          onMarkAsResolved={handleMarkAsResolved}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onSendAudio={handleSendAudio}
        />
      </div>
    </div>
  );
};
