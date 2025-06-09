
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

interface EmojiPickerCompactProps {
  onEmojiSelect: (emoji: string) => void;
  isDarkMode: boolean;
}

const emojiCategories = {
  'Frequentes': ['😀', '😊', '😂', '❤️', '👍', '👎', '😍', '😢', '😎', '🤔', '👏', '🙏'],
  'Rostos': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑'],
  'Gestos': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '✋', '👏', '🙌', '🤲', '🙏', '💪'],
  'Objetos': ['❤️', '💔', '💕', '💖', '💗', '💘', '💝', '💞', '💟', '🔥', '⭐', '🌟', '💫', '⚡', '💥', '💢', '💯', '🎉', '🎊']
};

export const EmojiPickerCompact: React.FC<EmojiPickerCompactProps> = ({
  onEmojiSelect,
  isDarkMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Frequentes');

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-9 w-9",
          isDarkMode ? "text-gray-400 hover:bg-[#27272a]" : "text-gray-600 hover:bg-gray-100"
        )}
      >
        <Smile size={20} />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className={cn(
            "absolute bottom-12 left-0 z-50 w-80 rounded-lg border shadow-lg",
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            {/* Categorias */}
            <div className={cn(
              "flex border-b",
              isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
            )}>
              {Object.keys(emojiCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "flex-1 px-2 py-2 text-xs font-medium transition-colors",
                    selectedCategory === category
                      ? isDarkMode 
                        ? "bg-[#3f3f46] text-white" 
                        : "bg-gray-100 text-gray-900"
                      : isDarkMode
                        ? "text-gray-400 hover:bg-[#3f3f46]"
                        : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Emojis */}
            <div className="p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {emojiCategories[selectedCategory as keyof typeof emojiCategories].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onEmojiSelect(emoji);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "p-2 rounded text-lg hover:scale-110 transition-transform text-center",
                      isDarkMode ? "hover:bg-[#3f3f46]" : "hover:bg-gray-100"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
