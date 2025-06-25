
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { getChannelDisplayNameSync } from '@/utils/channelMapping';
import { ChannelConversation } from '@/types/messages';
import { NotificationBadge } from './NotificationBadge';

interface ChatSidebarHeaderProps {
  channelId: string;
  conversations: ChannelConversation[];
  isDarkMode: boolean;
  onClose: () => void;
  onSidebarToggle: (open: boolean) => void;
  onRefresh: () => void;
}

export const ChatSidebarHeader: React.FC<ChatSidebarHeaderProps> = ({
  channelId,
  conversations = [],
  isDarkMode,
  onClose,
  onSidebarToggle,
  onRefresh
}) => {
  return (
    <div className={cn(
      "p-4 border-b flex items-center justify-between", 
      isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
    )}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Voltar">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-semibold", 
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {getChannelDisplayNameSync(channelId)}
          </h3>
          <NotificationBadge isDarkMode={isDarkMode} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onSidebarToggle(false)} 
          aria-label="Fechar barra lateral"
        >
          <X size={20} />
        </Button>
      </div>
    </div>
  );
};
