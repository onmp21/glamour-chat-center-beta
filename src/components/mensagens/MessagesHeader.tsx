
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface MessagesHeaderProps {
  isDarkMode: boolean;
}

export const MessagesHeader: React.FC<MessagesHeaderProps> = ({ isDarkMode }) => {
  return (
    <div className="text-left mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-full bg-[#b5103c]/10">
          <MessageSquare size={32} className="text-[#b5103c]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Mensagens
          </h1>
          <p className={cn(
            "text-lg",
            isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
          )}>
            Central de comunicação com seus clientes
          </p>
        </div>
      </div>
    </div>
  );
};
