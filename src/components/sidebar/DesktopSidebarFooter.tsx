
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatarSection } from './UserAvatarSection';
import { useTheme } from '@/components/theme-provider';

interface DesktopSidebarFooterProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const DesktopSidebarFooter: React.FC<DesktopSidebarFooterProps> = ({
  isDarkMode,
  toggleDarkMode
}) => {
  const { logout, user } = useAuth();
  const { theme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  // Usar o tema real do ThemeProvider
  const isCurrentlyDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="p-4 border-t border-border space-y-4">
      {/* User Avatar Section */}
      <UserAvatarSection 
        isDarkMode={isCurrentlyDark}
        userName={user?.name || 'Usuário'}
      />
      
      {/* Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="flex-1 justify-start hover:bg-accent"
        >
          {isCurrentlyDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {isCurrentlyDark ? 'Modo Claro' : 'Modo Escuro'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
