
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface EmptyStateProps {
  isDarkMode: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isDarkMode }) => {
  return (
    <div className={cn(
      "flex-1 flex items-center justify-center",
      isDarkMode ? "bg-zinc-950" : "bg-gray-50"
    )}>
      <div className="text-center max-w-md mx-auto px-8">
        <div className={cn(
          "w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center",
          isDarkMode ? "bg-zinc-800" : "bg-gray-100"
        )}>
          <MessageCircle size={48} className={cn(
            isDarkMode ? "text-zinc-400" : "text-gray-400"
          )} />
        </div>
        <h3 className={cn(
          "text-2xl font-light mb-4", 
          isDarkMode ? "text-white" : "text-gray-700"
        )}>
          Chat Empresarial
        </h3>
        <p className={cn(
          "text-sm leading-relaxed", 
          isDarkMode ? "text-zinc-400" : "text-gray-500"
        )}>
          Gerencie suas conversas de forma profissional e eficiente.
        </p>
        <p className={cn(
          "text-sm mt-2", 
          isDarkMode ? "text-zinc-400" : "text-gray-500"
        )}>
          Selecione uma conversa para começar a atender.
        </p>
      </div>
    </div>
  );
};
