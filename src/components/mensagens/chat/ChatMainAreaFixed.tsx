
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatHeaderFixed } from './ChatHeaderFixed';
import { MessageBubbleFixed } from './MessageBubbleFixed';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SimpleMessage {
  id: string;
  session_id: string;
  message: string;
  read_at: string;
  tipo_remetente?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  media_base64?: string;
}

interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  unread_count: number;
  updated_at: string;
}

interface ChatMainAreaFixedProps {
  selectedConv: Conversation | null;
  messages: SimpleMessage[];
  messagesLoading: boolean;
  isDarkMode: boolean;
  channelId: string;
  agentName?: string;
}

export const ChatMainAreaFixed: React.FC<ChatMainAreaFixedProps> = ({
  selectedConv,
  messages,
  messagesLoading,
  isDarkMode,
  channelId,
  agentName
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!selectedConv) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
      )}>
        <div className="text-center space-y-3">
          <div className={cn(
            "text-6xl mb-4",
            isDarkMode ? "text-gray-600" : "text-gray-400"
          )}>
            💬
          </div>
          <h3 className={cn(
            "text-lg font-medium",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Selecione uma conversa
          </h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            Escolha uma conversa da lista para começar a visualizar as mensagens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <ChatHeaderFixed
        contactName={selectedConv.contact_name}
        contactPhone={selectedConv.contact_phone}
        isDarkMode={isDarkMode}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <div className={cn(
                    "animate-spin rounded-full h-6 w-6 border-b-2 mx-auto",
                    isDarkMode ? "border-white" : "border-gray-900"
                  )}></div>
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    Carregando mensagens...
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className={cn(
                  "text-center",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  <div className="text-4xl mb-4">📱</div>
                  <p>Nenhuma mensagem encontrada</p>
                  <p className="text-sm mt-1">Esta conversa ainda não possui mensagens</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubbleFixed
                    key={`${message.id}-${message.read_at}`}
                    message={message}
                    isDarkMode={isDarkMode}
                    agentName={agentName}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className={cn(
        "border-t p-4",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        <div className={cn(
          "flex items-center p-3 rounded-lg border",
          isDarkMode ? "border-[#3f3f46] bg-[#27272a]" : "border-gray-300 bg-gray-50"
        )}>
          <span className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            Visualização de mensagens (somente leitura)
          </span>
        </div>
      </div>
    </div>
  );
};
