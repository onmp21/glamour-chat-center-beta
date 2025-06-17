
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';

interface UserProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserProfileAvatar: React.FC<UserProfileAvatarProps> = ({
  size = 'md',
  className = ''
}) => {
  const { user } = useAuth();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={user?.profile_picture_url || ''} 
        alt={user?.name || 'Usuário'} 
      />
      <AvatarFallback className="bg-[#b5103c] text-white">
        {user?.name ? getInitials(user.name) : <User size={16} />}
      </AvatarFallback>
    </Avatar>
  );
};
