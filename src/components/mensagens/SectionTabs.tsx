
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SectionTabsProps {
  activeTab: 'canais' | 'contatos';
  onTabChange: (tab: 'canais' | 'contatos') => void;
  isDarkMode: boolean;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({
  activeTab,
  onTabChange,
  isDarkMode
}) => {
  return (
    <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-[#18181b] rounded-lg max-w-xs">
      <Button
        variant={activeTab === 'canais' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('canais')}
        className={cn(
          "flex-1 text-xs px-2 py-1",
          activeTab === 'canais'
            ? "bg-white dark:bg-[#27272a] text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        )}
      >
        Canais
      </Button>
      <Button
        variant={activeTab === 'contatos' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('contatos')}
        className={cn(
          "flex-1 text-xs px-2 py-1",
          activeTab === 'contatos'
            ? "bg-white dark:bg-[#27272a] text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        )}
      >
        Contatos
      </Button>
    </div>
  );
};
