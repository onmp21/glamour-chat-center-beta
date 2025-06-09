
import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutGrid, Settings, FileText, MessageSquare } from 'lucide-react';

interface MobileNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeSection,
  onSectionChange,
  isDarkMode
}) => {
  const navigationItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Painel' },
    { id: 'mensagens', icon: MessageSquare, label: 'Mensagens' },
    { id: 'exames', icon: FileText, label: 'Exames' },
    { id: 'settings', icon: Settings, label: 'Config' }
  ];

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 border-t",
      isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-around py-2 px-1 safe-area-bottom">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-h-[60px]",
                isActive 
                  ? "text-[#b5103c]" 
                  : isDarkMode ? "text-gray-400" : "text-gray-600"
              )}
            >
              <IconComponent 
                size={20} 
                className={cn(
                  "mb-1",
                  isActive && "text-[#b5103c]"
                )} 
              />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-[#b5103c]"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
