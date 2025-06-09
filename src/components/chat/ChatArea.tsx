
import React from 'react';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/hooks/useChannelConversations';
import { MessageHistory } from './MessageHistory';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChannelMessagesRefactored } from '@/hooks/useChannelMessagesRefactored'; // Importar o hook

interface ChatAreaProps {
  isDarkMode: boolean;
  conversation: ChannelConversation;
  channelId: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ isDarkMode, conversation, channelId }) => {
  const { addMessage } = useChannelMessagesRefactored(channelId, conversation.id); // Obter addMessage

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Cabeçalho (não rola) */}
      <div className="flex-shrink-0">
        <ChatHeader 
          isDarkMode={isDarkMode} 
          conversation={conversation} 
          channelId={channelId} 
        />
      </div>
      
      {/* Área de Mensagens (rola) */}
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

      {/* Barra de Input (não rola, fica embaixo) */}
      <div className="flex-shrink-0">
        <ChatInput 
          channelId={channelId} 
          conversationId={conversation.id} 
          isDarkMode={isDarkMode} 
          addMessageToState={addMessage} // Passar addMessage para ChatInput
        />
      </div>
    </div>
  );
};


