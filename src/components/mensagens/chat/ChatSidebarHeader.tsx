
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, RefreshCw } from 'lucide-react';
import { getChannelDisplayName } from '@/utils/channelMapping';
import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced';
import { ChannelConversation } from '@/hooks/useChannelConversations';

interface ChatSidebarHeaderProps {
  channelId: string;
  conversations?: ChannelConversation[];
  isDarkMode: boolean;
  onClose: () => void;
  onSidebarToggle: (open: boolean) => void;
  onRefresh?: () => void;
}

export const ChatSidebarHeader: React.FC<ChatSidebarHeaderProps> = ({
  channelId,
  conversations = [],
  isDarkMode,
  onClose,
  onSidebarToggle,
  onRefresh
}) => {
  const {
    getConversationStatus
  } = useConversationStatusEnhanced();

  const handleRefreshClick = () => {
    if (onRefresh) {
      console.log('🔄 [CHAT_SIDEBAR] Refresh clicked - reloading conversations');
      onRefresh();

      // Feedback visual para o usuário
      const button = document.querySelector('[data-refresh-button]') as HTMLElement;
      if (button) {
        button.style.transform = 'rotate(360deg)';
        button.style.transition = 'transform 0.5s ease';
        setTimeout(() => {
          button.style.transform = '';
          button.style.transition = '';
        }, 500);
      }
    }
  };

  return (
    <div className={cn(
      "p-4 border-b flex items-center justify-between",
      isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
    )}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h3 className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
            {getChannelDisplayName(channelId)}
          </h3>
          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            {conversations?.length || 0} conversas
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefreshClick}
            data-refresh-button
          >
            <RefreshCw size={20} />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onSidebarToggle(false)}>
          <X size={20} />
        </Button>
      </div>
    </div>
  );
};
