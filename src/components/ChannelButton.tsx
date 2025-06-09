
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pin, X, MessageCircle } from 'lucide-react';

interface ChannelButtonProps {
  id: string;
  name: string;
  conversationCount?: number;
  isPinned?: boolean;
  isDarkMode: boolean;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
}

export const ChannelButton: React.FC<ChannelButtonProps> = ({
  id,
  name,
  conversationCount = 0,
  isPinned = false,
  isDarkMode,
  onTogglePin,
  onRemove,
  onClick
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className={cn(
        "relative group rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer card-animate",
        isDarkMode 
          ? "bg-gray-900 border-gray-800 hover:bg-gray-800" 
          : "bg-white border-gray-200 hover:bg-gray-50"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick(id)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn(
            "font-medium",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {name}
          </h3>
          {isPinned && !showActions && (
            <Pin size={16} className="text-primary" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <MessageCircle size={14} className={cn(
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )} />
          <span className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {conversationCount} conversas
          </span>
        </div>
      </div>
      
      {showActions && (
        <div className="absolute top-2 right-2 flex space-x-1 appear-animate">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(id);
            }}
            className={cn(
              "h-6 w-6 p-0 btn-animate-icon",
              isDarkMode 
                ? "hover:bg-gray-700 text-gray-400" 
                : "hover:bg-gray-200 text-gray-600"
            )}
          >
            <Pin size={12} className={isPinned ? "text-primary" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className={cn(
              "h-6 w-6 p-0 btn-animate-icon",
              isDarkMode 
                ? "hover:bg-red-900 text-red-400" 
                : "hover:bg-red-100 text-red-600"
            )}
          >
            <X size={12} />
          </Button>
        </div>
      )}
    </div>
  );
};
