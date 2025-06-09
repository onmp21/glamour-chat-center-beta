
import React from 'react';
import { ConversationActionsMenu } from './ConversationActionsMenu';

interface MoreOptionsDropdownProps {
  isDarkMode: boolean;
  conversationId?: string;
  channelId?: string;
  currentStatus?: 'unread' | 'in_progress' | 'resolved';
  contactName?: string;
  contactPhone?: string;
  lastActivity?: string;
  onStatusChange?: (status: 'unread' | 'in_progress' | 'resolved') => void;
  onRefresh?: () => void;
}

export const MoreOptionsDropdown: React.FC<MoreOptionsDropdownProps> = ({
  isDarkMode,
  conversationId,
  channelId,
  currentStatus,
  contactName,
  contactPhone,
  lastActivity,
  onStatusChange,
  onRefresh
}) => {
  return (
    <ConversationActionsMenu
      isDarkMode={isDarkMode}
      conversationId={conversationId}
      channelId={channelId}
      currentStatus={currentStatus}
      contactName={contactName}
      contactPhone={contactPhone}
      lastActivity={lastActivity}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
    />
  );
};
