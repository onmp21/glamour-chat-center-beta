
import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Phone, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { useSimpleConversations } from '@/hooks/useSimpleConversations';
import { useAuth } from '@/contexts/AuthContext';
import { MediaRendererFixed } from '@/components/chat/MediaRendererFixed';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  isDarkMode: boolean;
  channelId?: string;
  conversationId?: string;
}

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

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  contactName,
  isDarkMode,
  channelId = 'chat',
  conversationId
}) => {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  
  // Get conversation data
  const { conversations } = useSimpleConversations(channelId);
  const selectedConversation = conversationId 
    ? conversations.find(c => c.id === conversationId) || conversations[0]
    : conversations[0];
  
  // Get messages for the conversation
  const { messages, loading: messagesLoading } = useSimpleMessages(
    channelId, 
    selectedConversation?.id || null
  );

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const formatPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    }
    return phone;
  };

  const getSenderName = (message: SimpleMessage) => {
    const isAgent = message.tipo_remetente === 'USUARIO_INTERNO' || 
                    message.tipo_remetente === 'Yelena-ai' ||
                    message.tipo_remetente === 'Andressa-ai';
    
    if (isAgent) {
      if (message.tipo_remetente === 'Yelena-ai') return 'Yelena AI';
      if (message.tipo_remetente === 'Andressa-ai') return 'Andressa AI';
      return user?.name || 'Agente';
    }
    return message.nome_do_contato || selectedConversation?.contact_name || 'Cliente';
  };

  const isMediaMessage = (message: SimpleMessage) => {
    return message.media_base64 || 
           (message.mensagemtype && message.mensagemtype !== 'text') ||
           message.message.startsWith('data:') ||
           (message.message.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(message.message.replace(/\s/g, '')));
  };

  const getMediaContent = (message: SimpleMessage) => {
    return message.media_base64 || message.message;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay background */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Chat container */}
      <div className={cn(
        "relative ml-auto w-full max-w-md h-full flex flex-col shadow-2xl",
        isDarkMode ? "bg-[#09090b]" : "bg-white"
      )}>
        {/* Header */}
        <div className={cn(
          "p-4 flex items-center justify-between border-b",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#b5103c] flex items-center justify-center text-white font-semibold">
                {(selectedConversation?.contact_name || contactName).charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className={cn(
                "font-medium",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {selectedConversation?.contact_name || contactName}
              </h3>
              {selectedConversation?.contact_phone && (
                <p className={cn(
                  "text-xs",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  {formatPhone(selectedConversation.contact_phone)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <Video size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b5103c]"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    Nenhuma mensagem ainda
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.tipo_remetente === 'USUARIO_INTERNO' || 
                                message.tipo_remetente === 'Yelena-ai' ||
                                message.tipo_remetente === 'Andressa-ai';
                  const isMedia = isMediaMessage(message);
                  const mediaContent = getMediaContent(message);

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex mb-4",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] space-y-1",
                        isOwn ? "items-end" : "items-start"
                      )}>
                        {/* Sender name */}
                        <div className={cn(
                          "text-xs font-medium px-1",
                          isOwn ? "text-right" : "text-left",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {getSenderName(message)}
                        </div>

                        {/* Message bubble */}
                        <div className={cn(
                          "px-3 py-2 rounded-lg shadow-sm",
                          isOwn
                            ? "bg-[#b5103c] text-white"
                            : isDarkMode
                              ? "bg-[#27272a] text-white border border-[#3f3f46]"
                              : "bg-white text-gray-900 border border-gray-200"
                        )}>
                          {isMedia ? (
                            <MediaRendererFixed
                              content={mediaContent}
                              messageType={message.mensagemtype}
                              messageId={message.id}
                              isDarkMode={isDarkMode}
                              balloonColor={isOwn ? 'sent' : 'received'}
                            />
                          ) : (
                            <p className="text-sm break-words whitespace-pre-wrap">
                              {message.message}
                            </p>
                          )}
                        </div>

                        {/* Time */}
                        <div className={cn(
                          "text-xs px-1",
                          isOwn ? "text-right" : "text-left",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {formatTime(message.read_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message input */}
        <div className={cn(
          "p-4 border-t",
          isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
        )}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border",
                isDarkMode 
                  ? "bg-[#18181b] border-[#3f3f46] text-white placeholder-[#a1a1aa]"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
              )}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newMessage.trim()) {
                  // Message sending will be implemented later
                  console.log('Sending message:', newMessage);
                  setNewMessage('');
                }
              }}
            />
            <Button 
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
              onClick={() => {
                if (newMessage.trim()) {
                  // Message sending will be implemented later
                  console.log('Sending message:', newMessage);
                  setNewMessage('');
                }
              }}
            >
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
