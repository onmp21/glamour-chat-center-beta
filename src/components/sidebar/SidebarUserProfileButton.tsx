
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarUserProfileButtonProps {
  user: { id: string; name: string; role?: string } | null;
  avatarUrl?: string | null;
  isDarkMode: boolean;
  isCollapsed: boolean;
  onProfileClick: () => void;
}

export const SidebarUserProfileButton: React.FC<SidebarUserProfileButtonProps> = ({
  user,
  avatarUrl,
  isDarkMode,
  isCollapsed,
  onProfileClick,
}) => {
  if (!user) return null;

  // Geração de iniciais como fallback
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Apenas aviso para debug se tiver avatar ou não
  React.useEffect(() => {
    console.log('👤 [SidebarUserProfileButton] avatarUrl:', avatarUrl, '| user:', user);
  }, [avatarUrl, user]);

  // Colapsado = só avatar
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center space-y-3 mb-4">
        <button onClick={onProfileClick} aria-label="Alterar credenciais">
          <Avatar className="w-12 h-12 hover:ring-2 hover:ring-[#b5103c]/50 transition-all">
            <AvatarImage
              src={avatarUrl || undefined}
              alt={user.name}
              onError={e => { (e.currentTarget as HTMLImageElement).src = undefined!; }}
            />
            <AvatarFallback className="bg-[#b5103c] text-white text-sm font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    );
  }

  // Normal: avatar + infos, botão grande
  return (
    <button
      onClick={onProfileClick}
      className={cn(
        "flex items-center px-4 py-3 rounded-xl w-full mb-4 border transition-all duration-200",
        isDarkMode
          ? "bg-[#b5103c]/10 border-[#b5103c]/40 hover:bg-[#b5103c]/20"
          : "bg-[#b5103c]/5 border-[#b5103c]/20 hover:bg-[#b5103c]/10"
      )}
      style={{
        boxShadow: "0 0 0 1.5px #b5103c22"
      }}
      aria-label="Alterar foto e credenciais"
    >
      <Avatar className="w-10 h-10 mr-3">
        <AvatarImage
          src={avatarUrl || undefined}
          alt={user.name}
          onError={e => { (e.currentTarget as HTMLImageElement).src = undefined!; }}
          style={{ objectFit: "cover", background: "transparent" }}
        />
        <AvatarFallback className="bg-[#b5103c] text-white text-sm font-semibold">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start min-w-0">
        <span className={cn(
          "text-base font-medium truncate",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {user.name}
        </span>
        <span className={cn(
          "text-sm truncate",
          isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
        )}>
          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
        </span>
      </div>
    </button>
  );
};
