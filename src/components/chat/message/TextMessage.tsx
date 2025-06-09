
import React from 'react';
import { cn } from '@/lib/utils';

interface TextMessageProps {
  content: string;
  isDarkMode: boolean;
}

export const TextMessage: React.FC<TextMessageProps> = ({
  content,
  isDarkMode
}) => {
  const isLongText = content.length > 250;
  
  return (
    <p className={cn(
      "chat-message-text break-words",
      isLongText && "long-text"
    )}>
      {content}
    </p>
  );
};
