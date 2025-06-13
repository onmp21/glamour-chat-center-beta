
import React from 'react';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/types/messages';

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
      {/* Header */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        <div className="flex items-center space-x-3">
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
        <button
          onClick={onMarkAsResolved}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          Marcar como Resolvido
        </button>
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
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={cn(
        "p-4 border-t",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            className={cn(
              "flex-1 px-3 py-2 rounded-lg border",
              isDarkMode 
                ? "bg-[#333333] border-[#444444] text-white placeholder:text-gray-400"
                : "bg-white border-gray-300 text-gray-900"
            )}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  onSendMessage(target.value);
                  target.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input?.value.trim()) {
                onSendMessage(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-[#b5103c] text-white rounded-lg hover:bg-[#9d0e34]"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};
