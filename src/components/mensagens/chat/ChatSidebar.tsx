
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Search, RefreshCw } from 'lucide-react';
import { ChatSidebarHeader } from './ChatSidebarHeader';
import { ConversationsList } from './ConversationsList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatSidebarProps {
  channelId: string;
  conversations: Array<{
    id: string;
    contact_name: string;
    contact_phone: string;
    last_message: string;
    last_message_time: string;
    status: 'unread' | 'in_progress' | 'resolved';
    unread_count: number;
    updated_at: string;
  }>;
  selectedConversation: string | null;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onConversationSelect: (conversationId: string) => void;
  onSidebarToggle: (open: boolean) => void;
  onRefresh: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  channelId,
  conversations,
  selectedConversation,
  isSidebarOpen,
  isDarkMode,
  onClose,
  onConversationSelect,
  onSidebarToggle,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar conversas com base no termo de pesquisa
  const filteredConversations = conversations.filter(conversation => 
    conversation.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.contact_phone.includes(searchTerm) ||
    conversation.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para truncar nomes longos
  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Função para formatar preview da mensagem
  const formatMessagePreview = (message: string, messageType?: string) => {
    if (!message) return '';
    
    // Se é URL do storage, mostrar placeholder
    if (message.includes('supabase.co/storage/v1/object/public/media-files/')) {
      return '📎 Mídia';
    }

    // Se é base64, mostrar placeholder
    if (message.startsWith('data:')) {
      if (message.includes('image/')) return '📷 Imagem';
      if (message.includes('audio/')) return '🎵 Áudio';
      if (message.includes('video/')) return '🎥 Vídeo';
      return '📎 Mídia';
    }

    // Se é placeholder já processado
    if (message === '[Imagem]') return '📷 Imagem';
    if (message === '[Áudio]') return '🎵 Áudio';
    if (message === '[Vídeo]') return '🎥 Vídeo';
    if (message === '[Documento PDF]') return '📄 Documento';
    if (message === '[Mídia]') return '📎 Mídia';

    // Truncar mensagens de texto longas
    return message.length > 40 ? message.substring(0, 40) + '...' : message;
  };

  return (
    <div className={cn(
      "flex flex-col h-full border-r transition-all duration-300",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200",
      isSidebarOpen ? "w-80" : "w-0 overflow-hidden"
    )}>
      {/* Header do Sidebar */}
      <ChatSidebarHeader
        channelId={channelId}
        isDarkMode={isDarkMode}
        onClose={onClose}
        onSidebarToggle={onSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Barra de Pesquisa */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            size={16} 
          />
          <Input
            placeholder="Pesquisar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-10 pr-4 py-2 text-sm",
              isDarkMode 
                ? "bg-[#27272a] border-[#3f3f46] text-white placeholder-[#a1a1aa]"
                : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
            )}
          />
        </div>
      </div>

      {/* Botão de Refresh */}
      <div className="px-3 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="w-full justify-start"
        >
          <RefreshCw size={16} className="mr-2" />
          Atualizar conversas
        </Button>
      </div>

      {/* Lista de Conversas com Scroll */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
            )}>
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors",
                  selectedConversation === conversation.id
                    ? (isDarkMode ? "bg-[#27272a]" : "bg-blue-50")
                    : (isDarkMode ? "hover:bg-[#27272a]" : "hover:bg-gray-50")
                )}
              >
                {/* Avatar e Nome */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm",
                    "bg-gradient-to-r from-blue-500 to-purple-600"
                  )}>
                    {conversation.contact_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-sm truncate",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )} title={conversation.contact_name}>
                      {truncateName(conversation.contact_name)}
                    </div>
                    <div className={cn(
                      "text-xs",
                      isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
                    )}>
                      {conversation.contact_phone}
                    </div>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="bg-[#b5103c] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unread_count}
                    </div>
                  )}
                </div>

                {/* Última Mensagem e Hora */}
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "text-xs flex-1 truncate mr-2",
                    isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                  )}>
                    {formatMessagePreview(conversation.last_message)}
                  </div>
                  <div className={cn(
                    "text-xs whitespace-nowrap",
                    isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
                  )}>
                    {conversation.last_message_time ? 
                      new Date(conversation.last_message_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      ''
                    }
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex justify-end mt-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    conversation.status === 'unread' ? "bg-red-500" :
                    conversation.status === 'in_progress' ? "bg-yellow-500" :
                    "bg-green-500"
                  )} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
