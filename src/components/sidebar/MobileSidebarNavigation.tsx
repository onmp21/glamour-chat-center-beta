
import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutGrid, Settings, FileText, MessageSquare } from 'lucide-react';

interface MobileSidebarNavigationProps {
  isDarkMode: boolean;
  activeSection: string;
  onItemClick: (sectionId: string) => void;
}

export const MobileSidebarNavigation: React.FC<MobileSidebarNavigationProps> = ({
  isDarkMode,
  activeSection,
  onItemClick
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutGrid },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
    { id: 'exames', label: 'Exames', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  const getItemClasses = (isActive: boolean) => cn(
    "w-full flex items-center space-x-3 px-3 py-3 rounded-md text-left text-sm mobile-touch transition-colors",
    isActive
      ? "bg-[#b5103c] text-white"
      : isDarkMode ? "text-gray-200" : "text-gray-700"
  );

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {menuItems.map(item => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={getItemClasses(activeSection === item.id)}
          >
            <IconComponent size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
