
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SendButtonProps {
  hasContent: boolean;
  onSend: () => void;
  onStartRecording: () => void;
  sending: boolean;
  isDarkMode: boolean;
}

export const SendButton: React.FC<SendButtonProps> = ({
  hasContent,
  onSend,
  onStartRecording,
  sending,
  isDarkMode
}) => {
  if (hasContent) {
    return (
      <Button
        onClick={onSend}
        disabled={sending}
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full transition-all duration-200",
          sending
            ? isDarkMode 
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#b5103c] hover:bg-[#a00f36] text-white"
        )}
      >
        {sending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <Send size={18} />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onStartRecording}
      className={cn(
        "h-9 w-9 rounded-full",
        isDarkMode ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      )}
    >
      <Mic size={20} />
    </Button>
  );
};
