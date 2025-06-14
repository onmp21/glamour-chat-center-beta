
import React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'canais' | 'contatos')}>
      <TabsList className={cn(
        "grid w-full grid-cols-2",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-gray-100"
      )}>
        <TabsTrigger 
          value="canais" 
          className={cn(
            "data-[state=active]:bg-[#b5103c] data-[state=active]:text-white",
            isDarkMode ? "text-[#9ca3af] data-[state=inactive]:hover:bg-[#27272a]" : "text-gray-600"
          )}
        >
          Canais
        </TabsTrigger>
        <TabsTrigger 
          value="contatos"
          className={cn(
            "data-[state=active]:bg-[#b5103c] data-[state=active]:text-white",
            isDarkMode ? "text-[#9ca3af] data-[state=inactive]:hover:bg-[#27272a]" : "text-gray-600"
          )}
        >
          Contatos
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
