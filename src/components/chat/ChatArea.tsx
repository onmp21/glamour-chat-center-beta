
import React from 'react';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/types/messages';
import { MessageHistory } from './MessageHistory';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLazyChannelMessages } from '@/hooks/useLazyChannelMessages';
import { RawMessage } from '@/types/messages';

interface ChatAreaProps {
  isDarkMode: boolean;
  conversation: ChannelConversation;
  channelId: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ isDarkMode, conversation, channelId }) => {
  const { addMessage } = useLazyChannelMessages(channelId, conversation.id);

  // Função adaptadora para converter tipos
  const handleAddMessage = (message: RawMessage) => {
    addMessage(message);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <div className="flex-shrink-0">
        <ChatHeader 
          isDarkMode={isDarkMode} 
          conversation={conversation} 
          channelId={channelId} 
        />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <MessageHistory
            channelId={channelId}
            conversationId={conversation.id}
            isDarkMode={isDarkMode}
            className="h-full px-4 pt-4"
          />
        </ScrollArea>
      </div>

      <div className="flex-shrink-0">
        <ChatInput 
          channelId={channelId} 
          conversationId={conversation.id} 
          isDarkMode={isDarkMode} 
          addMessageToState={handleAddMessage}
        />
      </div>
    </div>
  );
};
