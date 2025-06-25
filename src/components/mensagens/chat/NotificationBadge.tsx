
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUnifiedConversationStatus } from '@/hooks/useUnifiedConversationStatus';

interface NotificationBadgeProps {
  isDarkMode: boolean;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  isDarkMode,
  className
}) => {
  const { statusCounts } = useUnifiedConversationStatus();
  
  // Mostrar apenas se há mensagens pendentes
  if (statusCounts.unread === 0) {
    return null;
  }

  return (
    <Badge 
      variant="default" 
      className={cn(
        "bg-[#b5103c] hover:bg-[#9d0e34] text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium",
        className
      )}
    >
      {statusCounts.unread > 99 ? '99+' : statusCounts.unread}
    </Badge>
  );
};
