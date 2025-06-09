
import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ChannelsSearchBarProps {
  isDarkMode: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ChannelsSearchBar: React.FC<ChannelsSearchBarProps> = ({
  isDarkMode,
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isDarkMode 
        ? "bg-[#18181b] border-[#3f3f46]" 
        : "bg-white border-gray-200 shadow-sm"
    )}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Buscar canais..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "pl-10 border-0",
            isDarkMode 
              ? "bg-[#27272a] text-white placeholder:text-gray-400" 
              : "bg-gray-50 text-gray-900 placeholder:text-gray-500"
          )}
        />
      </div>
    </div>
  );
};
