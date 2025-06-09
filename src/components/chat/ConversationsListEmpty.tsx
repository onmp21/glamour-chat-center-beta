
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface ConversationsListEmptyProps {
  isDarkMode: boolean;
}

export const ConversationsListEmpty: React.FC<ConversationsListEmptyProps> = ({
  isDarkMode
}) => {
  return (
    <div className="p-8 text-center">
      <MessageSquare size={48} className={cn("mx-auto mb-4", isDarkMode ? "text-[#a1a1aa]" : "text-gray-400")} />
      <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
        Nenhuma conversa encontrada
      </p>
    </div>
  );
};
