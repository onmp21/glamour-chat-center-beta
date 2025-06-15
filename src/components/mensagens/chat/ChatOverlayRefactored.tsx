import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, Bell, BellOff, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChannel } from '@/contexts/ChannelContext';
import { useLazyChannelMessages } from '@/hooks/useLazyChannelMessages';
import { useMessageSenderExtended } from '@/hooks/useMessageSenderExtended';
import { RawMessage } from '@/types/messages';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Input } from '@/components/ui/input';
import { ChatInput } from '@/components/mensagens/ChatInput';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingService';
import { getChannelDisplayName } from '@/utils/channelMapping';
import { ChatMainArea } from '@/components/mensagens/chat/ChatMainArea';
import { YelenaMessageDisplay } from "@/components/chat/YelenaMessageDisplay";
import { JoaoDouradoMessageDisplay } from "@/components/chat/JoaoDouradoMessageDisplay";
import { AmericaDouradaMessageDisplay } from "@/components/chat/AmericaDouradaMessageDisplay";
import { GerenteLojasMessageDisplay } from "@/components/chat/GerenteLojasMessageDisplay";
import { GerenteExternoMessageDisplay } from "@/components/chat/GerenteExternoMessageDisplay";
import { MessageBubble } from "@/components/chat/message/MessageBubble";
import { MessageContent } from "@/components/chat/message/MessageContent";

interface ChatOverlayProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSendFile: (file: File, caption?: string) => Promise<void>;
  onSendAudio: (audioBlob: Blob, duration: number) => Promise<void>;
}

export const ChatOverlayRefactored: React.FC<ChatOverlayProps> = ({
  channelId,
  isDarkMode,
  onClose,
  onSendFile,
  onSendAudio
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateChannelNotification } = useChannel();
  const [isMuted, setIsMuted] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { messages, loading: messagesLoading, error: messagesError, addMessage, updateMessage, refreshMessages } = useLazyChannelMessages(channelId, conversationId);
  const { sendMessage, sending } = useMessageSenderExtended();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannelName = async () => {
      const name = getChannelDisplayName(channelId);
      setChannelName(name);
    };
    fetchChannelName();
  }, [channelId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialPhone = urlParams.get('phone');
    if (initialPhone) {
      setConversationId(initialPhone);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) {
      toast({
        title: "Erro",
        description: "Selecione ou crie uma conversa antes de enviar mensagens.",
        variant: "destructive"
      });
      return;
    }

    const newMessageData = {
      conversationId: conversationId,
      channelId: channelId,
      content: content,
      sender: 'agent',
      agentName: user?.name,
      messageType: 'text' as const
    };

    const success = await sendMessage(newMessageData, addMessage);
    if (success) {
      console.log('✅ [CHAT_OVERLAY] Mensagem enviada com sucesso:', content);
    } else {
      console.error('❌ [CHAT_OVERLAY] Falha ao enviar mensagem:', content);
    }
  };

  const handleMarkAsResolved = () => {
    toast({
      title: "Sucesso",
      description: "Conversa marcada como resolvida."
    });
    onClose();
  };

  const handleSidebarToggle = (open: boolean) => {
    console.log(`[CHAT_OVERLAY] Toggling sidebar: ${open ? 'open' : 'closed'}`);
  };

  const handleMuteToggle = async () => {
    setIsMuted(!isMuted);
    if (updateChannelNotification) {
      try {
        await updateChannelNotification(channelId, !isMuted);
        toast({
          title: "Sucesso",
          description: `Notificações ${isMuted ? 'ativadas' : 'desativadas'} para este canal.`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao atualizar as configurações de notificação.",
          variant: "destructive"
        });
        setIsMuted(isMuted);
      }
    }
  };

  const getConversationForHeader = () => {
    return {
      contactName: 'Nome do Contato',
      contactNumber: conversationId || 'Número Desconhecido'
    };
  };

  function getMessageDisplayComponent(channelId: string) {
    switch (channelId) {
      case "chat":
      case "af1e5797-edc6-4ba3-a57a-25cf7297c4d6":
        return YelenaMessageDisplay;
      case "joao-dourado":
      case "621abb21-60b2-4ff2-a0a6-172a94b4b65c":
        return JoaoDouradoMessageDisplay;
      case "america-dourada":
      case "64d8acad-c645-4544-a1e6-2f0825fae00b":
        return AmericaDouradaMessageDisplay;
      case "gerente-lojas":
      case "d8087e7b-5b06-4e26-aa05-6fc51fd4cdce":
        return GerenteLojasMessageDisplay;
      case "gerente-externo":
      case "d2892900-ca8f-4b08-a73f-6b7aa5866ff7":
        return GerenteExternoMessageDisplay;
      default:
        return MessageBubble;
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center p-4",
      isDarkMode ? "bg-black/80" : "bg-white/80"
    )}>
      <div className={cn(
        "relative w-full max-w-4xl h-full max-h-[90vh] rounded-lg shadow-lg flex flex-col overflow-hidden",
        isDarkMode ? "bg-[#18181b] text-white" : "bg-white text-gray-900"
      )}>
        {/* Header */}
        <div className={cn(
          "p-4 border-b flex items-center justify-between h-[74px] min-h-[64px] max-h-[96px]",
          isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
        )}>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                {getConversationForHeader()?.contactName || channelName}
              </h2>
              <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                {getConversationForHeader()?.contactNumber || 'Número Desconhecido'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleMuteToggle}>
              {isMuted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Arquivar conversa
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Silenciar notificações
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  Excluir conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat Main Area */}
        <ChatMainArea
          selectedConv={{
            id: conversationId || 'default',
            contact_name: getConversationForHeader()?.contactName || 'Nome Desconhecido',
            contact_phone: conversationId || 'Número Desconhecido',
            last_message: '',
            last_message_time: new Date().toISOString(),
            status: 'unread',
            updated_at: new Date().toISOString()
          }}
          conversationForHeader={getConversationForHeader()}
          messages={messages}
          messagesLoading={messagesLoading}
          isSidebarOpen={false}
          isDarkMode={isDarkMode}
          channelId={channelId}
          onSidebarToggle={handleSidebarToggle}
          onMarkAsResolved={handleMarkAsResolved}
          onSendMessage={handleSendMessage}
          onSendFile={onSendFile}
          onSendAudio={onSendAudio}
        />
      </div>
    </div>
  );
};
