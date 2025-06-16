
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react'; // Removed RefreshCw as onRefresh is not used here directly for UI effect
import { getChannelDisplayName } from '@/utils/channelMapping'; // Ensure this is correctly imported
// import { useConversationStatusEnhanced } from '@/hooks/useConversationStatusEnhanced'; // Not used directly in this component after review
import { ChannelConversation } from '@/types/messages'; // Corrected import path if needed

interface ChatSidebarHeaderProps {
  channelId: string;
  conversations: ChannelConversation[]; // UnifiedConversation or ChannelConversation from props
  isDarkMode: boolean;
  onClose: () => void;
  onSidebarToggle: (open: boolean) => void;
  onRefresh: () => void; // Kept for triggering refresh, but visual effect removed for simplicity
}
export const ChatSidebarHeader: React.FC<ChatSidebarHeaderProps> = ({
  channelId,
  conversations = [],
  isDarkMode,
  onClose,
  onSidebarToggle,
  onRefresh // Prop is available if needed elsewhere, but direct visual effect removed
}) => {
  // const { getConversationStatus } = useConversationStatusEnhanced(); // Not directly used for display here

  // const handleRefreshClick = () => { // Visual refresh effect removed
  //   console.log('🔄 [CHAT_SIDEBAR] Refresh clicked - reloading conversations');
  //   onRefresh();
  // };

  return (
    <div className={cn("p-4 border-b flex items-center justify-between", isDarkMode ? "border-[#3f3f46]" : "border-gray-200")}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Voltar">
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
        {/* Example of using onRefresh if a button is desired */}
        {/* 
        <Button variant="ghost" size="icon" onClick={onRefresh} data-refresh-button aria-label="Atualizar conversas">
          <RefreshCw size={18} />
        </Button> 
        */}
        <Button variant="ghost" size="icon" onClick={() => onSidebarToggle(false)} aria-label="Fechar barra lateral">
          <X size={20} />
        </Button>
      </div>
    </div>
  );
};
