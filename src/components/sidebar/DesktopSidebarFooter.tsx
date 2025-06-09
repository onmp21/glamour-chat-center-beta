
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatarSection } from './UserAvatarSection';

interface DesktopSidebarFooterProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const DesktopSidebarFooter: React.FC<DesktopSidebarFooterProps> = ({
  isDarkMode,
  toggleDarkMode
}) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
      {/* User Avatar Section */}
      <UserAvatarSection 
        isDarkMode={isDarkMode}
        userName={user?.name || 'Usuário'}
      />
      
      {/* Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className={cn(
            "flex-1 justify-start",
            isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"
          )}
        >
          {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
            isDarkMode ? "text-red-400" : "text-red-600"
          )}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
