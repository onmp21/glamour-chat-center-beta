
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

interface ChannelsSectionHeaderProps {
  isDarkMode: boolean;
  onAddChannel: () => void;
}

export const ChannelsSectionHeader: React.FC<ChannelsSectionHeaderProps> = ({
  isDarkMode,
  onAddChannel
}) => {
  return (
    <div className={cn(
      "p-6 rounded-xl border",
      isDarkMode 
        ? "bg-[#18181b] border-[#3f3f46]" 
        : "bg-white border-gray-200 shadow-sm"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#b5103c]">
            <MessageSquare className="text-white" size={20} />
          </div>
          <div>
            <h1 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Canais de Atendimento
            </h1>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Gerencie todos os canais
            </p>
          </div>
        </div>
        
        <Button
          onClick={onAddChannel}
          size="sm"
          className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
        >
          <Plus size={16} className="mr-2" />
          Novo Canal
        </Button>
      </div>
    </div>
  );
};
