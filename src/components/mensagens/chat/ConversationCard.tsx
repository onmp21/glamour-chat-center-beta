
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChannelConversation } from '@/hooks/useChannelConversations';
import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced';
import { formatWhatsAppDate } from '@/utils/dateUtils';

interface ConversationCardProps {
  conversation: ChannelConversation;
  channelId: string;
  selectedConversation: string | null;
  isDarkMode: boolean;
  status: string;
  onConversationSelect: (id: string) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  channelId,
  selectedConversation,
  isDarkMode,
  status,
  onConversationSelect,
  getStatusColor,
  getStatusLabel
}) => {
  const { markConversationAsViewed } = useConversationStatusEnhanced();

  // Truncar mensagem recente para 35 caracteres
  const truncateMessage = (msg: string, max = 35) => {
    if (!msg) return '';
    return msg.length > max ? msg.slice(0, max - 3) + "..." : msg;
  };

  // Truncar nome do contato para não passar das margens do card
  const truncateContactName = (name: string, max = 25) => {
    if (!name) return 'Cliente';
    return name.length > max ? name.slice(0, max - 3) + "..." : name;
  };

  const handleConversationClick = async () => {
    // Marcar como visualizada (auto-transição de pendente para em andamento)
    await markConversationAsViewed(channelId, conversation.id);
    onConversationSelect(conversation.id);
  };

  return (
    <Card
      key={conversation.id}
      className={cn(
        "cursor-pointer transition-all relative",
        selectedConversation === conversation.id
          ? isDarkMode 
            ? "bg-red-100/10 border-red-400/50" 
            : "bg-red-50 border-red-200"
          : isDarkMode 
            ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" 
            : "bg-white border-gray-200 hover:bg-gray-50"
      )}
      onClick={handleConversationClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className={cn(
            "font-medium text-sm truncate",
            selectedConversation === conversation.id
              ? "text-red-600" 
              : (isDarkMode ? "text-white" : "text-gray-900")
          )}>
            {truncateContactName(conversation.contact_name)}
          </h4>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs flex-shrink-0",
              isDarkMode ? "text-gray-500" : "text-gray-500"
            )}>
              {formatWhatsAppDate(conversation.last_message_time)}
            </span>
            {/* Só mostrar badge se unread_count > 0 e status não é resolved */}
            {conversation.unread_count && conversation.unread_count > 0 && status !== 'resolved' && (
              <Badge className="bg-[#b5103c] text-white text-xs">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
        <p className={cn(
          "text-xs truncate mb-2",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          {truncateMessage(conversation.last_message || '')}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))}></div>
            <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              {getStatusLabel(status)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
