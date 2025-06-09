
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';

interface EmojiDropdownProps {
  isDarkMode: boolean;
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiDropdown: React.FC<EmojiDropdownProps> = ({
  isDarkMode,
  onEmojiSelect
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleDocumentClick = (e: Event) => {
    if (!(e.target as Element).closest('.emoji-dropdown-container')) {
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const emojis = ['😀', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '😊', '😎', '🤔', '😅', '🙌', '💪', '🎯', '✨', '🚀', '💯'];

  return (
    <div className="relative emoji-dropdown-container">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100")}
        onClick={(e) => {
          e.stopPropagation();
          setShowEmojiPicker(!showEmojiPicker);
        }}
      >
        <Smile size={18} />
      </Button>
      
      {showEmojiPicker && (
        <div className={cn(
          "absolute bottom-12 left-0 rounded-lg shadow-lg border p-3 z-50 grid grid-cols-5 gap-1 max-w-[200px]",
          isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"
        )}>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={cn(
                "p-2 rounded text-lg transition-colors hover:scale-110",
                isDarkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onEmojiSelect(emoji);
                setShowEmojiPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
