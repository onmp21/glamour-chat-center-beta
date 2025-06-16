import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useSupabaseAvatar } from "@/hooks/useSupabaseAvatar";

interface MobileSidebarFooterProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUserClick: () => void;
}

export const MobileSidebarFooter: React.FC<MobileSidebarFooterProps> = ({
  isDarkMode,
  toggleDarkMode,
  onUserClick
}) => {
  const { user, logout } = useAuth();
  const { getAvatarUrl } = useSupabaseAvatar();
  const { getProfile } = useUserProfile();
  const { theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = React.useState<string|null>(null);
  
  React.useEffect(() => {
    if (user?.id) {
      getAvatarUrl().then((url) => setAvatarUrl(url || null));
    }
  }, [user?.id, getAvatarUrl]);

  const profile = getProfile();

  // Usar o tema real do ThemeProvider
  const isCurrentlyDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-3 border-t border-border space-y-3">
      {/* Dark mode toggle */}
      <Button
        onClick={toggleDarkMode}
        variant="ghost"
        size="sm"
        className="w-full justify-start mobile-touch text-foreground"
      >
        {isCurrentlyDark ? <Sun size={16} /> : <Moon size={16} />}
        <span className="ml-2">{isCurrentlyDark ? 'Modo Claro' : 'Modo Escuro'}</span>
      </Button>

      {/* User info */}
      <button 
        onClick={onUserClick}
        className="w-full flex items-center space-x-3 px-3 py-3 rounded-md transition-colors cursor-pointer mobile-touch interactive-animate bg-accent hover:bg-accent/80"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatarUrl || profile?.profileImage || undefined} alt={user?.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.name ? getInitials(user.name) : <User size={20} />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate text-foreground">
            {user?.name}
          </p>
          <p className="text-xs truncate text-muted-foreground">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </button>

      {/* Logout */}
      <Button
        onClick={logout}
        variant="ghost"
        size="sm"
        className="w-full justify-start mobile-touch text-foreground"
      >
        <LogOut size={16} />
        <span className="ml-2">Sair</span>
      </Button>
    </div>
  );
};
