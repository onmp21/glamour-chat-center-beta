import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/types/messages';
import { ChatInput } from '@/components/mensagens/ChatInput';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { AIResumoOverlay } from '@/components/chat/AIResumoOverlay';
import { useUnifiedConversationStatus } from '@/hooks/useUnifiedConversationStatus';
import { InfiniteMessageHistory } from '@/components/chat/InfiniteMessageHistory';
import { supabase } from '@/integrations/supabase/client';
import { CHANNEL_TABLE_MAPPING } from '@/utils/channelMapping';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  media_url?: string;
}

interface Conversation {
  contactName: string;
  contactNumber: string;
}

export interface ChatMainAreaProps {
  selectedConv?: ChannelConversation;
  conversationForHeader?: Conversation | null;
  messages: Message[];
  messagesLoading: boolean;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  channelId: string;
  onSidebarToggle: (open: boolean) => void;
  onMarkAsResolved: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File, caption?: string) => Promise<void>;
  onSendAudio: (audioBlob: Blob, duration: number) => Promise<void>;
}

export const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  selectedConv,
  conversationForHeader,
  messages,
  messagesLoading,
  isSidebarOpen,
  isDarkMode,
  channelId,
  onSidebarToggle,
  onMarkAsResolved,
  onSendMessage,
  onSendFile,
  onSendAudio
}) => {
  console.log("🐛 [ChatMainArea] Renderizando com sistema de scroll infinito. selectedConv:", selectedConv, "conversationForHeader:", conversationForHeader);
  const [isResumoOpen, setIsResumoOpen] = useState(false);
  const { updateConversationStatus } = useUnifiedConversationStatus();

  // ==== TEMPO REAL ====
  useEffect(() => {
    if (!selectedConv || !channelId) return;

    const tableName = CHANNEL_TABLE_MAPPING[channelId];
    if (!tableName) return;

    console.log(`📡 [CHAT_REALTIME] Setting up realtime for ${tableName}, session: ${selectedConv.id}`);

    const channel = supabase
      .channel(`chat_${tableName}_${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `session_id=eq.${selectedConv.id}`
        },
        (payload) => {
          console.log('🔥 [CHAT_REALTIME] New message received:', payload);
          // O InfiniteMessageHistory vai lidar com novas mensagens automaticamente
        }
      )
      .subscribe();

    return () => {
      console.log(`📡 [CHAT_REALTIME] Cleaning up realtime for ${tableName}`);
      supabase.removeChannel(channel);
    };
  }, [selectedConv?.id, channelId]);

  // ==== FUNÇÕES UTILITÁRIAS ====
  const getChannelDisplayName = (channel: string) => {
    const mapping: Record<string, string> = {
      'chat': 'Yelena AI',
      'yelena_ai_conversas': 'Yelena AI',
      'canarana': 'Canarana',
      'souto-soares': 'Souto Soares',
      'joao-dourado': 'João Dourado',
      'america-dourada': 'América Dourada',
      'gerente-lojas': 'Gustavo Gerente',
      'gerente-externo': 'Andressa Gerente'
    };
    return mapping[channel] || channel;
  };

  const getLastInteractionTime = () => {
    if (!selectedConv?.last_message_time) return 'Sem interação recente';
    
    try {
      const lastTime = new Date(selectedConv.last_message_time);
      return formatDistanceToNow(lastTime, { 
        addSuffix: true,
        locale: ptBR 
      });
    } catch (error) {
      console.error('❌ [LAST_INTERACTION] Erro ao formatar tempo:', error);
      return 'Tempo indisponível';
    }
  };

  const handleGenerateSummary = () => {
    if (!selectedConv || !channelId) {
      console.error('❌ [AI_SUMMARY] Conversa ou canal não selecionado');
      return;
    }
    
    console.log('🤖 [AI_SUMMARY] Abrindo modal de resumo para:', {
      conversationId: selectedConv.id,
      channelId,
      contactName: selectedConv.contact_name
    });
    
    setIsResumoOpen(true);
  };

  const handleMarkAsResolved = async () => {
    if (!selectedConv || !channelId) {
      console.error('❌ [MARK_RESOLVED] Conversa ou canal não selecionado');
      return;
    }

    try {
      console.log('✅ [MARK_RESOLVED] Marcando conversa como resolvida:', {
        conversationId: selectedConv.id,
        channelId,
        contactName: selectedConv.contact_name
      });

      const success = await updateConversationStatus(channelId, selectedConv.id, 'resolved', true);
      
      if (success) {
        console.log('✅ [MARK_RESOLVED] Conversa marcada como resolvida com sucesso');
        // Chamar callback para atualizar lista de conversas
        if (onMarkAsResolved) {
          onMarkAsResolved();
        }
      } else {
        console.error('❌ [MARK_RESOLVED] Falha ao marcar conversa como resolvida');
      }
    } catch (error) {
      console.error('❌ [MARK_RESOLVED] Erro ao marcar conversa como resolvida:', error);
    }
  };

  if (!selectedConv) {
    return <div className={cn("flex-1 flex items-center justify-center", isDarkMode ? "bg-[#09090b] text-white" : "bg-gray-50 text-gray-900")}>
        <p className="text-lg">Selecione uma conversa para começar</p>
      </div>;
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full", isDarkMode ? "bg-[#09090b]" : "bg-white")}>
      {/* Header */}
      <div className={cn("p-4 border-b flex items-center justify-between h-[74px] min-h-[64px] max-h-[96px]", isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white")}>
        <div className="flex flex-col">
          <h2 className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
            {conversationForHeader?.contactName || selectedConv.contact_name}
          </h2>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              {conversationForHeader?.contactNumber || selectedConv.contact_phone}
            </span>
            <span className={cn("text-xs px-2 py-1 rounded-full", isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600")}>
              {getLastInteractionTime()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleGenerateSummary}
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center space-x-2 h-9",
              isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Brain size={16} />
            <span>Resumo IA</span>
          </Button>

          <AIResumoOverlay
            open={isResumoOpen}
            onClose={() => setIsResumoOpen(false)}
            isDarkMode={isDarkMode}
            conversationId={selectedConv.id}
            channelId={channelId}
            contactName={selectedConv.contact_name}
            isLoading={false}
          />
          
          <Button 
            onClick={handleMarkAsResolved} 
            size="sm" 
            className="text-white bg-[#b5103c] hover:bg-[#a00e35] h-9"
          >
            Marcar como Resolvido
          </Button>
        </div>
      </div>

      {/* Mensagens com sistema infinito de scroll */}
      <InfiniteMessageHistory
        channelId={channelId}
        conversationId={selectedConv.id}
        isDarkMode={isDarkMode}
        className="flex-1"
      />

      {/* Input fixo */}
      <div
        className={cn("w-full", isDarkMode ? "bg-[#18181b]" : "bg-white")}
        style={{
          minHeight: 82,
          maxHeight: 96,
        }}
      >
        <ChatInput 
          isDarkMode={isDarkMode} 
          onSendMessage={onSendMessage} 
          onSendFile={onSendFile} 
          onSendAudio={onSendAudio} 
          selectedConv={selectedConv} 
          channelId={channelId} 
        />
      </div>
    </div>
  );
};
