import React, { useState, useRef, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/types/messages';
import { ChatInput } from '@/components/mensagens/ChatInput';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Loader2 } from 'lucide-react';
import { openaiService } from '@/services/openaiService';
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
;
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
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);

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

  const handleGenerateSummary = async () => {
    if (!selectedConv || !channelId) {
      console.error('❌ [AI_SUMMARY] Conversa ou canal não selecionado');
      return;
    }
    try {
      setIsGeneratingSummary(true);
      console.log('🤖 [AI_SUMMARY] Gerando resumo da conversa...');
      const summary = await openaiService.generateConversationSummary(channelId, selectedConv.contact_phone);
      setSummaryContent(summary);
      console.log('✅ [AI_SUMMARY] Resumo gerado com sucesso');

      // Mostrar o resumo em um modal ou área dedicada
      // Por enquanto, vamos usar um alert para demonstração
      alert(`Resumo da Conversa:\n\n${summary}`);
    } catch (error) {
      console.error('❌ [AI_SUMMARY] Erro ao gerar resumo:', error);
      alert('Erro ao gerar resumo da conversa. Verifique a configuração da API OpenAI.');
    } finally {
      setIsGeneratingSummary(false);
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
          {/* Botão de Resumo com IA */}
          <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary} variant="outline" size="sm" className={cn("flex items-center space-x-2", isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300 text-gray-700 hover:bg-gray-50")}>
            {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            <span>{isGeneratingSummary ? 'Gerando...' : 'Resumo IA'}</span>
          </Button>
          
          <Button onClick={onMarkAsResolved} size="sm" className="text-white bg-[#b5103c] py-0 my-0 text-center">
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
        style={{
          minHeight: 0,
          height: "calc(100vh - 74px - 96px - env(safe-area-inset-bottom, 0px))", // header + input
          maxHeight: "calc(100vh - 74px - 96px - env(safe-area-inset-bottom, 0px))",
          // fallback for browser, otherwise flex-1
        }}
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

              // Nome do CLIENTE (só nome)
              const contactName =
                (message as any).Nome_do_contato ||
                (message as any).nome_do_contato ||
                message.sender ||
                "Cliente";
              const nomeExibido = truncateName(contactName);

              // Nome do canal E nome do usuário (se enviado via sistema)
              const canalNome = getChannelDisplayName(channelId);

              // Format Hora
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
                        // Balão do cliente externo: só nome
                        <span>{nomeExibido}</span>
                      )}
                      {isAgent && (
                        <>
                          <span>
                            {/* Nome do canal se for agente */}
                            {canalNome}
                          </span>
                          {/* Se a mensagem for USUARIO_INTERNO e mandada pelo sistema (ex: sender === "agent") */}
                          {message.tipo_remetente === "USUARIO_INTERNO" && !!message.Nome_do_contato && (
                            <span className="font-semibold">
                              {/* Exibir nome do usuario, mas só quando for mensagem enviada pelo sistema */}
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
        <ChatInput isDarkMode={isDarkMode} onSendMessage={onSendMessage} onSendFile={onSendFile} onSendAudio={onSendAudio} selectedConv={selectedConv} channelId={channelId} />
      </div>
    </div>
  );
};
