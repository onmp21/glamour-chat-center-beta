
import React from 'react';
import { ChatOverlayRefactored } from './chat/ChatOverlayRefactored';

interface ChatOverlayProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = (props) => {
  return <ChatOverlayRefactored {...props} />;
};
