
import React from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageHistory } from '@/components/chat/MessageHistory';
import { MessageInput } from '@/components/chat/MessageInput';

interface ChatMainAreaProps {
  selectedConv: any;
  conversationForHeader: {
    contactName: string;
    contactNumber: string;
  } | null;
  messages: Array<{
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
  }>;
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
  return (
    <div className="flex flex-col h-full">
      {/* Header da Conversa */}
      {conversationForHeader && (
        <div className={cn(
          "flex items-center p-4 border-b",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSidebarToggle(true)}
              className="mr-3"
            >
              <Menu size={20} />
            </Button>
          )}
          
          {/* Avatar */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3",
            "bg-gradient-to-r from-blue-500 to-purple-600"
          )}>
            {conversationForHeader.contactName.substring(0, 2).toUpperCase()}
          </div>
          
          {/* Nome e Número */}
          <div className="flex-1">
            <div className={cn(
              "font-semibold text-base",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {conversationForHeader.contactName}
            </div>
            <div className={cn(
              "text-sm",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
            )}>
              {conversationForHeader.contactNumber}
            </div>
          </div>

          {/* Status e Ações */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-2 py-1 rounded text-xs",
              selectedConv?.status === 'unread' ? "bg-red-100 text-red-700" :
              selectedConv?.status === 'in_progress' ? "bg-yellow-100 text-yellow-700" :
              "bg-green-100 text-green-700"
            )}>
              {selectedConv?.status === 'unread' ? 'Não lida' :
               selectedConv?.status === 'in_progress' ? 'Em andamento' :
               'Resolvida'}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAsResolved}
              className="text-xs"
            >
              Marcar como resolvida
            </Button>
          </div>
        </div>
      )}

      {/* Área de Mensagens com Scroll Fixo */}
      <div className="flex-1 overflow-hidden">
        {selectedConv ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <MessageHistory
                channelId={channelId}
                conversationId={selectedConv.id}
                isDarkMode={isDarkMode}
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className={cn(
                "text-lg font-medium mb-2",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Selecione uma conversa
              </div>
              <div className={cn(
                "text-sm",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
              )}>
                Escolha uma conversa na barra lateral para começar
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input de Mensagem Fixo */}
      {selectedConv && (
        <div className={cn(
          "border-t p-4",
          isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
        )}>
          <MessageInput
            onSendMessage={onSendMessage}
            onSendFile={onSendFile}
            onSendAudio={onSendAudio}
            isDarkMode={isDarkMode}
            placeholder="Digite sua mensagem..."
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};
