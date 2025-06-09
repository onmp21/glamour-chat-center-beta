
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LogOut, Moon, Sun, User } from 'lucide-react';

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
  const { getProfile } = useUserProfile();
  
  const profile = getProfile();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      "p-3 border-t space-y-3"
    )} style={{
      borderColor: isDarkMode ? '#333333' : '#e5e7eb'
    }}>
      {/* Dark mode toggle */}
      <Button
        onClick={toggleDarkMode}
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start mobile-touch",
          isDarkMode ? "text-gray-200" : "text-gray-700"
        )}
      >
        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        <span className="ml-2">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
      </Button>

      {/* User info */}
      <button 
        onClick={onUserClick}
        className={cn(
          "w-full flex items-center space-x-3 px-3 py-3 rounded-md transition-colors cursor-pointer mobile-touch interactive-animate"
        )} 
        style={{
          backgroundColor: isDarkMode ? '#333333' : '#f9fafb'
        }}
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile?.profileImage || undefined} alt={user?.name} />
          <AvatarFallback className={cn(
            "text-sm font-medium",
            "bg-[#b5103c] text-white"
          )}>
            {user?.name ? getInitials(user.name) : <User size={20} />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className={cn(
            "text-sm font-medium truncate",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {user?.name}
          </p>
          <p className={cn(
            "text-xs truncate",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </button>

      {/* Logout */}
      <Button
        onClick={logout}
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start mobile-touch",
          isDarkMode ? "text-gray-200" : "text-gray-700"
        )}
      >
        <LogOut size={16} />
        <span className="ml-2">Sair</span>
      </Button>
    </div>
  );
};
