
import React from 'react';
import { AudioPlayerFixed } from './AudioPlayerFixed';

interface WhatsAppAudioPlayerProps {
  audioUrl: string;
  isDarkMode?: boolean;
  messageId: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  audioUrl,
  ...props
}) => {
  return <AudioPlayerFixed audioContent={audioUrl} {...props} />;
};
