
import React from 'react';
import { ChatOverlay as OriginalChatOverlay } from '../ChatOverlay';

interface ChatOverlayProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
  channelId, 
  isDarkMode, 
  onClose 
}) => {
  return (
    <OriginalChatOverlay
      isOpen={true}
      onClose={onClose}
      contactName="Cliente"
      isDarkMode={isDarkMode}
      channelId={channelId}
    />
  );
};
