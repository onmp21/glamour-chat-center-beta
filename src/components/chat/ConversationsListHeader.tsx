
import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationsListHeaderProps {
  isDarkMode: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export const ConversationsListHeader: React.FC<ConversationsListHeaderProps> = ({
  isDarkMode,
  refreshing,
  onRefresh
}) => {
  const handleRefresh = () => {
    console.log('🔄 [CONVERSATIONS_HEADER] Refresh button clicked');
    onRefresh();
  };

  return (
    <div className="px-[31px] py-[28px]">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold my-0">
          Conversas
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing} 
          className={cn(
            "h-8 w-8 p-0",
            isDarkMode ? "hover:bg-[#27272a] text-[#fafafa]" : "hover:bg-gray-100"
          )}
          title="Recarregar conversas"
        >
          <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
};
