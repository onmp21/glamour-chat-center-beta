
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface MessagesHeaderProps {
  isDarkMode: boolean;
}

export const MessagesHeader: React.FC<MessagesHeaderProps> = ({ isDarkMode }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className={cn(
        "p-3 rounded-lg",
        isDarkMode ? "bg-[#18181b]" : "bg-white"
      )}>
        <MessageSquare size={24} className="text-[#b5103c]" />
      </div>
      <div>
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-[#ffffff]" : "text-gray-900"
        )}>
          Mensagens
        </h1>
        <p className={cn(
          "text-sm",
          isDarkMode ? "text-[#9ca3af]" : "text-gray-600"
        )}>
          Gerencie suas conversas e contatos
        </p>
      </div>
    </div>
  );
};
