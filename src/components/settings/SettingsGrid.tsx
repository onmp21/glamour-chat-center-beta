

import React from 'react';
import { cn } from '@/lib/utils';
import { Users, History, Settings, Folder, Shield, Bell, Palette, Database, Sun, Moon, LogOut, Brain, MessageSquare } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SettingsGridProps {
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
  toggleDarkMode: () => void;
}

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  show: boolean;
  badge?: string;
  onClick?: () => void;
}

// Compact Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  onClick: () => void;
  isDarkMode: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  isDarkMode
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] text-left",
        "flex items-center gap-3",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" : "bg-white border-gray-200 hover:bg-gray-50"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
      )}>
        <Icon size={20} className="text-[#b5103c]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={cn("font-medium text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
          {title}
        </h3>
        <p className={cn("text-xs mt-0.5", isDarkMode ? "text-gray-400" : "text-gray-600")}>
          {description}
        </p>
      </div>
    </button>
  );
};

export const SettingsGrid: React.FC<SettingsGridProps> = ({
  isDarkMode,
  onSectionChange,
  toggleDarkMode
}) => {
  const { canManageUsers, canAccessAuditHistory, canManageTabs } = usePermissions();
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Main settings items
  const mainItems: SettingsItem[] = [
    {
      id: 'credentials',
      title: 'Alterar Credenciais',
      description: 'Altere sua senha e informações de login',
      icon: Shield,
      show: true
    },
    {
      id: 'notifications',
      title: 'Configurações de Notificação',
      description: 'Configure alertas e notificações do sistema',
      icon: Bell,
      show: true
    },
    {
      id: 'users',
      title: 'Gerenciamento de Usuários',
      description: 'Adicione, edite ou remova usuários do sistema',
      icon: Users,
      show: canManageUsers(),
      badge: 'Admin'
    },
    {
      id: 'channels',
      title: 'Gerenciar Canais',
      description: 'Ative e desative canais do sistema',
      icon: Folder,
      show: canManageTabs(),
      badge: 'Admin'
    },
    {
      id: 'audit',
      title: 'Histórico de Auditoria',
      description: 'Visualize logs de atividades e ações do sistema',
      icon: History,
      show: canAccessAuditHistory(),
      badge: 'Admin'
    },
    {
      id: 'ai',
      title: 'Configurações de IA',
      description: 'Configure a integração com ChatGPT para relatórios',
      icon: Brain,
      show: canManageUsers(),
      badge: 'Admin'
    },
    {
      id: 'evolution',
      title: 'API Evolution',
      description: 'Configure instâncias e envie mensagens via API Evolution',
      icon: MessageSquare,
      show: canManageUsers(),
      badge: 'Admin'
    },
    {
      id: 'system',
      title: 'Sistema',
      description: 'Configurações gerais e preferências avançadas',
      icon: Settings,
      show: true
    },
    {
      id: 'backup',
      title: 'Backup e Dados',
      description: 'Gerencie backups automáticos e exportação de dados',
      icon: Database,
      show: canManageUsers(),
      badge: 'Admin'
    }
  ];

  const visibleMainItems = mainItems.filter(item => item.show);

  const handleItemClick = (item: SettingsItem) => {
    if (item.onClick) {
      item.onClick();
    } else {
      onSectionChange(item.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Main settings cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {visibleMainItems.map((item) => (
          <SettingsCard
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            onClick={() => handleItemClick(item)}
            isDarkMode={isDarkMode}
            badge={item.badge}
          />
        ))}
      </div>

      {/* Compact Action cards (appearance and logout) - Centralized */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          <ActionCard
            title="Aparência"
            description={`Alternar para modo ${isDarkMode ? 'claro' : 'escuro'}`}
            icon={isDarkMode ? Sun : Moon}
            onClick={toggleDarkMode}
            isDarkMode={isDarkMode}
          />
          <ActionCard
            title="Sair da Conta"
            description="Encerre sua sessão atual"
            icon={LogOut}
            onClick={handleLogout}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

