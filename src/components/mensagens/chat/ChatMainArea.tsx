
import React, { useState } from 'react';
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
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  channelId: string;
  onSidebarToggle: (open: boolean) => void;
  onMarkAsResolved: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onSendFile: (file: File, caption?: string) => Promise<void>;
  onSendAudio: (audioBlob: Blob, duration: number) => Promise<void>;
};

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
  
  const handleGenerateSummary = async () => {
    if (!selectedConv || !channelId) {
      console.error('❌ [AI_SUMMARY] Conversa ou canal não selecionado');
      return;
    }

    try {
      setIsGeneratingSummary(true);
      console.log('🤖 [AI_SUMMARY] Gerando resumo da conversa...');
      
      const summary = await openaiService.generateConversationSummary(
        channelId, 
        selectedConv.contact_phone
      );
      
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
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        isDarkMode ? "bg-[#09090b] text-white" : "bg-gray-50 text-gray-900"
      )}>
        <p className="text-lg">Selecione uma conversa para começar</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col",
      isDarkMode ? "bg-[#09090b]" : "bg-white"
    )}>
      {/* Header com funções de IA */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        <div className="flex flex-col">
          <h2 className={cn(
            "font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {conversationForHeader?.contactName || selectedConv.contact_name}
          </h2>
          <span className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {conversationForHeader?.contactNumber || selectedConv.contact_phone}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botão de Resumo com IA */}
          <Button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center space-x-2",
              isDarkMode 
                ? "border-[#3f3f46] text-white hover:bg-[#27272a]" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            {isGeneratingSummary ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Brain size={16} />
            )}
            <span>{isGeneratingSummary ? 'Gerando...' : 'Resumo IA'}</span>
          </Button>
          
          <Button
            onClick={onMarkAsResolved}
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Marcar como Resolvido
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender === 'agent' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                    message.sender === 'agent'
                      ? "bg-[#b5103c] text-white"
                      : isDarkMode
                      ? "bg-[#3f3f46] text-white"
                      : "bg-gray-200 text-gray-900"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input com funções de IA */}
      <ChatInput
        isDarkMode={isDarkMode}
        onSendMessage={onSendMessage}
        onSendFile={onSendFile}
        onSendAudio={onSendAudio}
        selectedConv={selectedConv}
        channelId={channelId}
      />
    </div>
  );
};
