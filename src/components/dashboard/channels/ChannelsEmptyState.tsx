
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

interface ChannelsEmptyStateProps {
  isDarkMode: boolean;
  searchTerm: string;
  onClearSearch: () => void;
  onAddChannel: () => void;
}

export const ChannelsEmptyState: React.FC<ChannelsEmptyStateProps> = ({
  isDarkMode,
  searchTerm,
  onClearSearch,
  onAddChannel
}) => {
  return (
    <div className={cn(
      "text-center py-16 rounded-xl border",
      isDarkMode 
        ? "bg-[#18181b] border-[#3f3f46]" 
        : "bg-white border-gray-200 shadow-sm"
    )}>
      <div className={cn(
        "p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center",
        isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
      )}>
        <MessageSquare className="text-[#b5103c]" size={40} />
      </div>
      <h3 className={cn(
        "text-xl font-semibold mb-2",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        {searchTerm ? 'Nenhum canal encontrado' : 'Nenhum canal disponível'}
      </h3>
      <p className={cn(
        "text-sm mb-6",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        {searchTerm 
          ? `Nenhum canal corresponde à pesquisa "${searchTerm}"`
          : 'Crie seu primeiro canal para começar'
        }
      </p>
      {searchTerm ? (
        <Button
          variant="outline"
          onClick={onClearSearch}
          className="px-6"
        >
          Limpar pesquisa
        </Button>
      ) : (
        <Button
          onClick={onAddChannel}
          className="bg-[#b5103c] hover:bg-[#9d0e34] text-white px-6"
        >
          <Plus size={18} className="mr-2" />
          Criar Primeiro Canal
        </Button>
      )}
    </div>
  );
};
