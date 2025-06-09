
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isVisible: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  showCollapseButton?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  isDarkMode,
  toggleDarkMode,
  isVisible,
  isCollapsed,
  onToggleCollapse,
  showCollapseButton = true
}) => {
  const { user, logout } = useAuth();
  const { getProfileByUserId } = useUserProfiles();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userProfile = user ? getProfileByUserId(user.id) : null;

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: BarChart3 },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
    { id: 'exams', label: 'Exames', icon: FileText },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserProfileClick = () => {
    onSectionChange('settings');
  };

  return (
    <>
      <div className={cn(
        "h-full transition-all duration-300 flex flex-col",
        isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200",
        "border-r",
        isVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header com Logo */}
        <div className="p-4 border-b border-inherit">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/2e823263-bd82-49e9-84f6-6327c136da53.png" 
                    alt="Villa Glamour Logo" 
                    className="w-8 h-8 object-contain"
                    style={{ background: 'transparent' }}
                  />
                </div>
                <div>
                  <span className={cn(
                    "font-bold text-lg",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    Villa Glamour
                  </span>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                  )}>
                    Sistema de Atendimento
                  </p>
                </div>
              </div>
            ) : (
              showCollapseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className={cn(
                    "h-8 w-8 mx-auto",
                    isDarkMode ? "text-[#a1a1aa] hover:bg-[#18181b]" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <PanelLeftClose size={24} className="text-[#b5103c]" strokeWidth={1.5} />
                </Button>
              )
            )}
            {showCollapseButton && !isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className={cn(
                  "h-8 w-8",
                  isDarkMode ? "text-[#a1a1aa] hover:bg-[#18181b]" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <PanelLeftClose size={24} className="text-[#b5103c]" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200",
                  activeSection === item.id
                    ? "bg-[#b5103c] text-white shadow-lg"
                    : isDarkMode
                      ? "text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon 
                  size={isCollapsed ? 28 : 20} 
                  className={activeSection === item.id ? "text-white" : "text-[#b5103c]"} 
                  strokeWidth={1.5} 
                />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer com Avatar e Usuário */}
        <div className="p-4 border-t border-inherit">
          {/* Avatar quando recolhido */}
          {isCollapsed && user && (
            <div className="flex flex-col items-center space-y-3 mb-4">
              <button onClick={handleUserProfileClick}>
                <Avatar className="w-12 h-12 hover:ring-2 hover:ring-[#b5103c]/50 transition-all">
                  <AvatarImage src={userProfile?.avatar_url || undefined} alt={user.name} />
                  <AvatarFallback className="bg-[#b5103c] text-white text-sm font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          )}

          {/* Avatar quando expandido */}
          {!isCollapsed && user && (
            <button
              onClick={handleUserProfileClick}
              className="w-full mb-4 p-3 rounded-xl bg-[#b5103c]/5 border border-[#b5103c]/20 hover:bg-[#b5103c]/10 hover:border-[#b5103c]/30 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={userProfile?.avatar_url || undefined} alt={user.name} />
                  <AvatarFallback className="bg-[#b5103c] text-white text-sm font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className={cn(
                    "text-sm font-semibold truncate",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {user.name}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                  )}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </div>
            </button>
          )}
          
          <div className={cn(
            "space-y-2", 
            isCollapsed ? "flex flex-col items-center space-y-3" : ""
          )}>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={toggleDarkMode}
              className={cn(
                isCollapsed ? "w-10 h-10" : "w-full justify-start",
                isDarkMode ? "text-[#a1a1aa] hover:bg-[#18181b]" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {isDarkMode ? 
                <Sun size={isCollapsed ? 24 : 18} className="text-[#b5103c]" strokeWidth={1.5} /> : 
                <Moon size={isCollapsed ? 24 : 18} className="text-[#b5103c]" strokeWidth={1.5} />
              }
              {!isCollapsed && <span className="ml-3 font-medium">
                {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
              </span>}
            </Button>
            
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={() => setShowLogoutConfirm(true)}
              className={cn(
                isCollapsed ? "w-10 h-10" : "w-full justify-start",
                "text-red-600 hover:bg-red-50 hover:text-red-700",
                isDarkMode && "hover:bg-red-900/20"
              )}
            >
              <LogOut size={isCollapsed ? 24 : 18} strokeWidth={1.5} />
              {!isCollapsed && <span className="ml-3 font-medium">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className={cn(
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Confirmar Logout
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
            )}>
              Tem certeza que deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : ""
            )}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
