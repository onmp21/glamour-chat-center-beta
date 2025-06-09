
import React from 'react';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';

interface Conversation {
  contactName: string;
  contactNumber: string;
}

interface ConversationHeaderProps {
  conversation: Conversation;
  isDarkMode: boolean;
  onMarkAsResolved?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  isDarkMode
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4",
      isDarkMode ? "bg-[#18181b]" : "bg-white"
    )}>
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
            {conversation.contactName}
          </h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {conversation.contactNumber}
          </p>
        </div>
      </div>
    </div>
  );
};
