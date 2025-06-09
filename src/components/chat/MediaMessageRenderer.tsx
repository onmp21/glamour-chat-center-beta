
import React from 'react';
import { MediaRendererFixed } from './MediaRendererFixed';

interface MediaMessageRendererProps {
  content: string;
  messageType: string;
  messageId: string;
  isDarkMode?: boolean;
  fileName?: string;
}

export const MediaMessageRenderer: React.FC<MediaMessageRendererProps> = (props) => {
  return <MediaRendererFixed {...props} />;
};
