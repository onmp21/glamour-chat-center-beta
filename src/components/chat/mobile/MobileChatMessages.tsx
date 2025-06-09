import React, { useRef, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageHistory } from '@/components/chat/MessageHistory';

interface MobileChatMessagesProps {
  isDarkMode: boolean;
  channelId?: string;
  conversationId?: string;
}

export const MobileChatMessages: React.FC<MobileChatMessagesProps> = ({
  isDarkMode,
  channelId,
  conversationId
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // SCROLL FORÇADO MÚLTIPLAS ESTRATÉGIAS
  useLayoutEffect(() => {
    const forceScrollToBottom = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        
        // Estratégia 1: ScrollTop máximo
        container.scrollTop = container.scrollHeight;
        
        // Estratégia 2: ScrollTo
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });
        
        console.log('📱 [MOBILE_SCROLL] Forced scroll - ScrollTop:', container.scrollTop, 'ScrollHeight:', container.scrollHeight);
      }
    };

    // Scroll imediato e múltiplas tentativas
    forceScrollToBottom();
    
    const timeouts = [0, 50, 100, 200, 500, 1000].map(delay =>
      setTimeout(forceScrollToBottom, delay)
    );
    
    return () => timeouts.forEach(clearTimeout);
  }, [conversationId, channelId]);

  return (
    <div 
      ref={scrollContainerRef}
      className={cn(
        "flex-1 overflow-y-auto",
        isDarkMode ? "bg-zinc-950" : "bg-gray-50"
      )}
      style={{
        height: 'calc(100vh - 72px - 100px - env(safe-area-inset-bottom, 16px))',
        scrollBehavior: 'auto',
        overflowAnchor: 'none',
        display: 'flex',
        flexDirection: 'column-reverse' // Inverte a direção para começar de baixo
      }}
    >
      {channelId && conversationId ? (
        <MessageHistory
          channelId={channelId}
          conversationId={conversationId}
          isDarkMode={isDarkMode}
          className="h-full"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <span className={cn(
              "text-xs px-3 py-1 rounded-full",
              isDarkMode ? "bg-zinc-800 text-zinc-500" : "bg-gray-200 text-gray-600"
            )}>
              Selecione uma conversa para ver as mensagens
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
