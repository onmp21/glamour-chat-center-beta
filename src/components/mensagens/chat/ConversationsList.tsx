
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationCard } from './ConversationCard';
import { ChannelConversation } from '@/hooks/useChannelConversations';
import { useUnifiedConversationStatus } from '@/hooks/useUnifiedConversationStatus';

interface ConversationsListProps {
  channelId: string;
  conversations: ChannelConversation[];
  selectedConversation: string | null;
  isDarkMode: boolean;
  onConversationSelect: (id: string) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  channelId,
  conversations,
  selectedConversation,
  isDarkMode,
  onConversationSelect
}) => {
  const { getConversationStatus } = useUnifiedConversationStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unread': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvida';
      default: return 'Desconhecido';
    }
  };

  // Ordenar conversas APENAS por data mais recente (sem priorização por status)
  const sortedConversations = [...conversations].sort((a, b) => {
    const timeA = a.last_message_time || a.updated_at;
    const timeB = b.last_message_time || b.updated_at;
    
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    const dateA = new Date(timeA).getTime();
    const dateB = new Date(timeB).getTime();
    
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    
    return dateB - dateA; // Mais recente primeiro (independente do status)
  });

  console.log('📊 [CONVERSATIONS_LIST] Conversas ordenadas apenas por data:', sortedConversations.map(c => ({
    id: c.id,
    contact: c.contact_name,
    status: getConversationStatus(channelId, c.id),
    last_message_time: c.last_message_time,
    unread_count: c.unread_count
  })));

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-2 space-y-1">
          {sortedConversations.map((conversation) => {
            const status = getConversationStatus(channelId, conversation.id);
            
            return (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                channelId={channelId}
                selectedConversation={selectedConversation}
                isDarkMode={isDarkMode}
                status={status}
                onConversationSelect={onConversationSelect}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
