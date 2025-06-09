
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';

interface TagDropdownProps {
  isDarkMode: boolean;
  onTagSelect: (tag: string) => void;
}

export const TagDropdown: React.FC<TagDropdownProps> = ({
  isDarkMode,
  onTagSelect
}) => {
  const [showTagOptions, setShowTagOptions] = useState(false);

  const handleDocumentClick = (e: Event) => {
    if (!(e.target as Element).closest('.tag-dropdown-container')) {
      setShowTagOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const tags = ['#urgente', '#venda', '#suporte', '#dúvida'];

  return (
    <div className="relative tag-dropdown-container">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100")}
        onClick={(e) => {
          e.stopPropagation();
          setShowTagOptions(!showTagOptions);
        }}
      >
        <Tag size={18} />
      </Button>
      
      {showTagOptions && (
        <div className={cn(
          "absolute bottom-12 left-0 rounded-lg shadow-lg border p-2 z-50 min-w-[120px]",
          isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"
        )}>
          {tags.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start mb-1"
              onClick={(e) => {
                e.stopPropagation();
                onTagSelect(tag);
                setShowTagOptions(false);
              }}
            >
              <span className={isDarkMode ? "text-zinc-200" : "text-gray-700"}>{tag}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
