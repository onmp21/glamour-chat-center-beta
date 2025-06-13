
import React from 'react';
import { ChatOverlayRefactored } from './chat/ChatOverlayRefactored';

interface ChatOverlayProps {
  channelId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = (props) => {
  // Funções vazias para satisfazer as props obrigatórias
  const handleSendFile = async (file: File, caption?: string) => {
    console.log('File send not implemented in this wrapper');
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    console.log('Audio send not implemented in this wrapper');
  };

  return (
    <ChatOverlayRefactored 
      {...props} 
      onSendFile={handleSendFile}
      onSendAudio={handleSendAudio}
    />
  );
};
