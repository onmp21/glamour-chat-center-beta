
import React from 'react';
import { useConversationStatus } from '@/hooks/useConversationStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationStatusManagerProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
}

export const ConversationStatusManager: React.FC<ConversationStatusManagerProps> = ({
  channelId,
  conversationId,
  isDarkMode
}) => {
  const { getConversationStatus, updateConversationStatus } = useConversationStatus();
  const currentStatus = getConversationStatus(channelId, conversationId);

  const handleStatusChange = async (newStatus: 'unread' | 'in_progress' | 'resolved') => {
    await updateConversationStatus(channelId, conversationId, newStatus);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <AlertCircle size={16} className="text-red-500" />;
      case 'in_progress': return <Clock size={16} className="text-yellow-500" />;
      case 'resolved': return <CheckCircle size={16} className="text-green-500" />;
      default: return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unread': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvida';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-500 hover:bg-red-600';
      case 'in_progress': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'resolved': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1",
          isDarkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"
        )}
      >
        {getStatusIcon(currentStatus)}
        {getStatusLabel(currentStatus)}
      </Badge>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={currentStatus === 'unread' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('unread')}
          className={cn(
            "h-7 px-2 text-xs",
            currentStatus === 'unread' && getStatusColor('unread')
          )}
        >
          Pendente
        </Button>
        
        <Button
          size="sm"
          variant={currentStatus === 'in_progress' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('in_progress')}
          className={cn(
            "h-7 px-2 text-xs",
            currentStatus === 'in_progress' && getStatusColor('in_progress')
          )}
        >
          Em Andamento
        </Button>
        
        <Button
          size="sm"
          variant={currentStatus === 'resolved' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('resolved')}
          className={cn(
            "h-7 px-2 text-xs",
            currentStatus === 'resolved' && getStatusColor('resolved')
          )}
        >
          Resolvida
        </Button>
      </div>
    </div>
  );
};
