import React, { useState, useRef, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/types/messages';
import { ChatInput } from '@/components/mensagens/ChatInput';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { AIResumoOverlay } from '@/components/chat/AIResumoOverlay';
import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced';

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
  console.log("🐛 [ChatMainArea] Renderizando. selectedConv:", selectedConv, "conversationForHeader:", conversationForHeader);
  const [isResumoOpen, setIsResumoOpen] = useState(false);
  const { updateConversationStatus } = useConversationStatusEnhanced();

  // ==== SCROLL AUTOMÁTICO ROBUSTO ====
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let count = 0;
    const maxAttempts = 8;
    function scrollToBottom() {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
    scrollToBottom();
    // Múltiplas tentativas para garantir scroll após animações ou timeout de render
    const timeouts: NodeJS.Timeout[] = [];
    for (let delay of [0, 50, 100, 150, 250, 500, 1000, 1200]) {
      timeouts.push(setTimeout(scrollToBottom, delay));
    }
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [messages.length, messagesLoading]);

  // ===== Utils para nome, canal e hora =====
  // Truncar nome para dois primeiros termos
  const truncateName = (name: string = ''): string => {
    const parts = (name || '').split(' ').filter(Boolean);
    return parts.slice(0, 2).join(' ') || name || 'Cliente';
  };
  // Formatar hora como HH:mm
  const formatHour = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
      });
    } catch {
      return '--:--';
    }
  };
  // Canal amigável
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
        // Chamar callback para atualizar a lista se existir
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
          <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
            {conversationForHeader?.contactNumber || selectedConv.contact_phone}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botão de Resumo com IA - ALTURA CORRIGIDA */}
          <Button
            onClick={handleGenerateSummary}
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center space-x-2 h-9", // ALTURA FIXA IGUAL AO BOTÃO AO LADO
              isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Brain size={16} />
            <span>Resumo IA</span>
          </Button>

          {/* Modal de Resumo */}
          <AIResumoOverlay
            open={isResumoOpen}
            onClose={() => setIsResumoOpen(false)}
            isDarkMode={isDarkMode}
            conversationId={selectedConv.id}
            channelId={channelId}
            contactName={selectedConv.contact_name}
          />
          
          {/* Botão Marcar como Resolvido - FUNÇÃO CORRIGIDA */}
          <Button 
            onClick={handleMarkAsResolved} 
            size="sm" 
            className="text-white bg-[#b5103c] hover:bg-[#a00e35] h-9" // ALTURA FIXA
          >
            Marcar como Resolvido
          </Button>
        </div>
      </div>

      {/* Mensagens */}
      <div
        ref={messagesContainerRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 transition-all",
          isDarkMode ? "bg-[#09090b]" : "bg-white"
        )}
        style={{ minHeight: 0 }}
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isAgent =
                message.tipo_remetente === "USUARIO_INTERNO" ||
                message.tipo_remetente === "Yelena-ai" ||
                message.sender === "agent";
              const contactName =
                (message as any).Nome_do_contato ||
                (message as any).nome_do_contato ||
                message.sender ||
                "Cliente";
              const nomeExibido = truncateName(contactName);
              const canalNome = getChannelDisplayName(channelId);
              const hora = (message as any).read_at
                ? formatHour((message as any).read_at)
                : formatHour(message.timestamp || new Date().toISOString());

              return (
                <div
                  key={message.id}
                  className={cn("flex", isAgent ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                      isAgent
                        ? "bg-[#b5103c] text-white"
                        : isDarkMode
                        ? "bg-[#3f3f46] text-white"
                        : "bg-gray-200 text-gray-900"
                    )}
                  >
                    <div className="flex gap-2 text-xs mb-1 opacity-80">
                      {!isAgent && (
                        <span>{nomeExibido}</span>
                      )}
                      {isAgent && (
                        <>
                          <span>
                            {canalNome}
                          </span>
                          {message.tipo_remetente === "USUARIO_INTERNO" && !!message.Nome_do_contato && (
                            <span className="font-semibold">
                              {message.Nome_do_contato}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-70 mt-1 text-right">{hora}</p>
                  </div>
                </div>
              );
            })}
            {/* Mantém o div de referência para garantir scroll no final */}
            <div />
          </div>
        )}
      </div>

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
