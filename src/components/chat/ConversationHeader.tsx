
import React from 'react';
import { cn } from '@/lib/utils';
import { Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChannelConversation } from '@/hooks/useChannelConversations';

interface ConversationHeaderProps {
  conversation: ChannelConversation;
  channelId: string;
  isDarkMode: boolean;
  onBack?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  channelId,
  isDarkMode,
  onBack
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 border-b",
      isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
    )}>
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={cn(
            "rounded-full",
            isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <ArrowLeft size={20} />
        </Button>
      )}
      
      <div className="flex items-center gap-3 flex-1">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isDarkMode ? "bg-gray-700" : "bg-gray-100"
        )}>
          <Phone size={20} className={isDarkMode ? "text-gray-300" : "text-gray-600"} />
        </div>
        
        <div className="flex-1">
          <h3 className={cn(
            "font-medium",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {conversation.contact_name}
          </h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {conversation.contact_phone}
          </p>
        </div>
      </div>
    </div>
  );
};
