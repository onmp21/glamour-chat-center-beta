
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserProfileAvatar } from '@/components/UserProfileAvatar';
import { User } from 'lucide-react';

interface SidebarUserProfileButtonProps {
  user: any;
  avatarUrl: string | null;
  isDarkMode: boolean;
  isCollapsed: boolean;
  onProfileClick: () => void;
}

export const SidebarUserProfileButton: React.FC<SidebarUserProfileButtonProps> = ({
  user,
  avatarUrl,
  isDarkMode,
  isCollapsed,
  onProfileClick
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onProfileClick}
          className={cn(
            "w-10 h-10 rounded-full p-0",
            isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"
          )}
        >
          <UserProfileAvatar size="sm" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={onProfileClick}
      className={cn(
        "w-full justify-start p-3 h-auto mb-3",
        isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"
      )}
    >
      <div className="flex items-center space-x-3 w-full">
        <UserProfileAvatar size="sm" />
        <div className="flex-1 text-left min-w-0">
          <p className={cn(
            "font-medium text-sm truncate",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {user?.name || 'Usuário'}
          </p>
          <p className={cn(
            "text-xs truncate",
            isDarkMode ? "text-zinc-400" : "text-gray-500"
          )}>
            {user?.email || 'Alterar credenciais'}
          </p>
        </div>
      </div>
    </Button>
  );
};
