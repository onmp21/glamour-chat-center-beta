import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import { MessageHistory } from './MessageHistory';
import { ChatInput } from './ChatInput';
import { useChannelMessagesRefactored } from '@/hooks/useChannelMessagesRefactored';

interface MobileChatViewProps {
  isDarkMode: boolean;
  mobileConversationId: string | null;
  onBack: () => void;
  channelId: string | null;
}

export const MobileChatView: React.FC<MobileChatViewProps> = ({
  isDarkMode,
  mobileConversationId,
  onBack,
  channelId,
}) => {
  const { addMessage } = useChannelMessagesRefactored(channelId || '');

  const conversationName = "Nome do Contato"; 
  const conversationPhone = mobileConversationId || "";

  if (!mobileConversationId || !channelId) {
    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-4", isDarkMode ? "bg-zinc-900 text-zinc-400" : "bg-gray-100 text-gray-600")}>
        <p>Erro: Conversa ou canal não selecionado.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full w-full pb-20", isDarkMode ? "bg-zinc-950" : "bg-white")}>
      <div className={cn(
        "flex items-center p-3 border-b sticky top-0 z-10",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
      )}>
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className={cn("h-5 w-5", isDarkMode ? "text-zinc-300" : "text-gray-700")} />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-base truncate", isDarkMode ? "text-zinc-100" : "text-gray-900")}>
            {conversationName} 
          </h3>
          <p className={cn("text-xs truncate", isDarkMode ? "text-zinc-400" : "text-gray-500")}>
            {conversationPhone}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <MessageHistory
            channelId={channelId}
            conversationId={mobileConversationId}
            isDarkMode={isDarkMode}
            className="h-full px-3 pt-3" 
          />
        </ScrollArea>
      </div>

      <div className={cn("flex-shrink-0 border-t p-2", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
        <ChatInput 
          channelId={channelId} 
          conversationId={mobileConversationId} 
          isDarkMode={isDarkMode}
          addMessageToState={addMessage}
        />
      </div>
    </div>
  );
};
