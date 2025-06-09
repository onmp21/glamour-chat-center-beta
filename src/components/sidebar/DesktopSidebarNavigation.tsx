
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

interface DesktopSidebarNavigationProps {
  items: NavigationItem[];
  isCollapsed: boolean;
  isDarkMode: boolean;
}

export const DesktopSidebarNavigation: React.FC<DesktopSidebarNavigationProps> = ({
  items,
  isCollapsed,
  isDarkMode
}) => {
  return (
    <nav className="flex-1 px-3 py-4">
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                item.isActive
                  ? isDarkMode
                    ? "bg-red-900/20 text-red-400 border-l-2 border-red-400"
                    : "bg-red-50 text-red-600 border-l-2 border-red-600"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon 
                className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "w-8 h-8" : "w-5 h-5 mr-3"
                )} 
              />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={cn(
                      "ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full",
                      isDarkMode ? "bg-red-600 text-white" : "bg-red-100 text-red-800"
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
