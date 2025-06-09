
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsGrid } from './settings/SettingsGrid';
import { UserManagementCompact } from './settings/UserManagementCompact';
import { AuditHistoryCompact } from './settings/AuditHistoryCompact';
import { CredentialsSection } from './settings/CredentialsSection';
import { NotificationsSection } from './settings/NotificationsSection';
import { ChannelManagementCompact } from './settings/ChannelManagementCompact';
import { SystemSection } from './settings/SystemSection';
import { BackupSection } from './settings/BackupSection';
import { AIConfigSection } from './settings/AIConfigSection';
import { EvolutionAPIFullSection } from './settings/EvolutionAPIFullSection';

interface UnifiedSettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isMobile?: boolean;
}

export const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({
  isDarkMode,
  toggleDarkMode,
  isMobile = false
}) => {
  const [activeSection, setActiveSection] = useState<string>('main');

  const handleBack = () => {
    if (activeSection === 'main') {
      return;
    }
    setActiveSection('main');
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'users':
        return 'Gerenciamento de Usuários';
      case 'audit':
        return 'Histórico de Auditoria';
      case 'credentials':
        return 'Alterar Credenciais';
      case 'notifications':
        return 'Configurações de Notificação';
      case 'channels':
        return 'Gerenciar Canais';
      case 'system':
        return 'Sistema';
      case 'backup':
        return 'Backup e Dados';
      case 'ai':
        return 'Configurações de IA';
      case 'evolution':
        return 'API Evolution';
      default:
        return 'Configurações';
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagementCompact isDarkMode={isDarkMode} />;
      case 'audit':
        return <AuditHistoryCompact isDarkMode={isDarkMode} />;
      case 'credentials':
        return <CredentialsSection isDarkMode={isDarkMode} />;
      case 'notifications':
        return <NotificationsSection isDarkMode={isDarkMode} />;
      case 'channels':
        return <ChannelManagementCompact isDarkMode={isDarkMode} />;
      case 'system':
        return <SystemSection isDarkMode={isDarkMode} />;
      case 'backup':
        return <BackupSection isDarkMode={isDarkMode} />;
      case 'ai':
        return <AIConfigSection isDarkMode={isDarkMode} />;
      case 'evolution':
        return <EvolutionAPIFullSection isDarkMode={isDarkMode} />;
      default:
        return <SettingsGrid isDarkMode={isDarkMode} onSectionChange={setActiveSection} toggleDarkMode={toggleDarkMode} />;
    }
  };

  return (
    <div className={cn("h-full flex flex-col", isDarkMode ? "bg-background" : "bg-gray-50")}>
      {/* Header - apenas quando não está na seção principal */}
      <div className={cn("flex items-center gap-4 p-6 mb-6", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
        {activeSection !== 'main' && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack} 
            className={cn(
              "rounded-full", 
              isDarkMode ? "text-muted-foreground hover:bg-accent" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
              {getSectionTitle()}
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
              {activeSection === 'main' ? 'Gerencie suas preferências e configurações do sistema' : 'Configure e personalize suas opções'}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {renderSection()}
      </div>
    </div>
  );
};
