
import React from 'react';
import { cn } from '@/lib/utils';

interface ContactNameDisplayProps {
  name: string;
  className?: string;
  maxLength?: number;
  isDarkMode?: boolean;
}

export const ContactNameDisplay: React.FC<ContactNameDisplayProps> = ({
  name,
  className = '',
  maxLength = 20,
  isDarkMode = false
}) => {
  const truncatedName = name && name.length > maxLength 
    ? name.substring(0, maxLength) + '...' 
    : name;

  return (
    <span 
      className={cn(
        "truncate font-medium",
        isDarkMode ? "text-white" : "text-gray-900",
        className
      )}
      title={name} // Mostra o nome completo no hover
    >
      {truncatedName || 'Contato'}
    </span>
  );
};
