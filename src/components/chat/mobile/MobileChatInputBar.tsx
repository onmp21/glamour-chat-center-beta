
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, Smile } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { useMessageSender } from '@/hooks/useMessageSender';

interface MobileChatInputBarProps {
  isDarkMode: boolean;
  onSendMessage: (message: string) => void;
  conversationId?: string;
  channelId?: string;
}

export const MobileChatInputBar: React.FC<MobileChatInputBarProps> = ({
  isDarkMode,
  onSendMessage,
  conversationId,
  channelId
}) => {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const { sendMessage, sending } = useMessageSender(channelId || '', conversationId || '', () => {});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (message.trim() && conversationId && channelId) {
      const success = await sendMessage({
        conversationId,
        channelId,
        content: message.trim(),
        sender: 'agent',
        agentName: 'Atendente'
      });
      
      if (success) {
        onSendMessage(message.trim());
        setMessage('');
      }
    } else if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const cursorPosition = input.selectionStart || 0;
      const textBefore = message.substring(0, cursorPosition);
      const textAfter = message.substring(cursorPosition);
      const newText = textBefore + emoji + textAfter;
      
      setMessage(newText);
      
      setTimeout(() => {
        if (input) {
          input.selectionStart = input.selectionEnd = cursorPosition + emoji.length;
          input.focus();
        }
      }, 10);
    }
    setShowEmojis(false);
  };

  return (
    <>
      <div 
        className={cn(
          "fixed left-0 right-0 p-3 border-t z-50",
          isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"
        )}
        style={{
          bottom: "calc(60px + env(safe-area-inset-bottom, 16px))", // Acima da hotbar mobile
          paddingBottom: "16px"
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              disabled={sending}
              className={cn(
                "pr-12 rounded-full border-0 focus:ring-1",
                isDarkMode 
                  ? "bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:ring-red-700" 
                  : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-red-300"
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojis(!showEmojis)}
                className={cn(
                  "w-8 h-8 rounded-full",
                  isDarkMode ? "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-400" : "text-gray-500 hover:bg-gray-200 hover:text-gray-600"
                )}
              >
                <Smile size={16} />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            size="icon"
            className={cn(
              "flex-shrink-0 rounded-full transition-all duration-200",
              message.trim() && !sending
                ? "bg-[#b5103c] hover:bg-[#a00f36] text-white shadow-md"
                : isDarkMode 
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>

        {showEmojis && (
          <EmojiPicker
            isDarkMode={isDarkMode}
            onEmojiSelect={onEmojiSelect}
            onClose={() => setShowEmojis(false)}
          />
        )}
      </div>
    </>
  );
};
