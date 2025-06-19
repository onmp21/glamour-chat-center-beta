
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationCard } from './ConversationCard';
import { ChannelConversation } from '@/hooks/useChannelConversations';
import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced';

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
  const { getConversationStatus } = useConversationStatusEnhanced();

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

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => {
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
