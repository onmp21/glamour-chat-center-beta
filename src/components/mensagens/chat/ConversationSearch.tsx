
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isDarkMode: boolean;
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  searchTerm,
  onSearchChange,
  isDarkMode
}) => {
  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="p-3 border-b border-border/50">
      <div className="relative">
        <Search 
          size={18} 
          className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}
        />
        <input
          type="text"
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-10 py-2 text-sm rounded-lg border transition-colors",
            isDarkMode 
              ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-400 focus:border-[#b5103c]" 
              : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#b5103c]"
          )}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors",
              isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
