import React, { useState, useEffect } from 'react';
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
  initialSection?: string; // NOVO
}

export const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({
  isDarkMode,
  toggleDarkMode,
  isMobile = false,
  initialSection
}) => {
  const [activeSection, setActiveSection] = useState<string>('main');

  // Quando for inicializado, pular para a subseção se for passada
  useEffect(() => {
    // Só atualiza se inicializando e initialSection for válida
    const SUBSECTIONS = [
      'credentials',
      'notifications',
      'users',
      'channels',
      'audit',
      'ai',
      'evolution',
      'system',
      'backup',
    ];
    if (initialSection && SUBSECTIONS.includes(initialSection)) {
      setActiveSection(initialSection);
    }
  // Só rodar na montagem ou se initialSection mudar
  }, [initialSection]);

  // Listagem das principais seções da aba configurações:
  // 1. credentials: Alterar Credenciais
  // 2. notifications: Configurações de Notificação
  // 3. users: Gerenciamento de Usuários
  // 4. channels: Gerenciar Canais
  // 5. audit: Histórico de Auditoria
  // 6. ai: Configurações de IA
  // 7. evolution: API Evolution
  // 8. system: Sistema
  // 9. backup: Backup e Dados

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
        // Use apenas o componente compacto padronizado (sem títulos internos)
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
    <div className={cn(
      "h-full flex flex-col min-h-screen w-full",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* Header único */}
      <div className={cn(
        "flex items-center gap-4 p-6 mb-6 border-b",
        isDarkMode ? "text-[#ffffff] border-[#18181b] bg-[#09090b]" : "text-gray-900 border-gray-200 bg-gray-50"
      )}>
        {activeSection !== 'main' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className={cn(
              "rounded-full",
              isDarkMode ? "text-[#9ca3af] hover:bg-[#27272a]" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10"
          )}>
            <Settings className="h-6 w-6 text-[#b5103c]" />
          </div>
          <div>
            <h1 className={cn(
              "text-3xl font-bold",
              isDarkMode ? "text-[#ffffff]" : "text-gray-900"
            )}>
              {getSectionTitle()}
            </h1>
            <p className={cn(
              "text-lg",
              isDarkMode ? "text-[#9ca3af]" : "text-gray-600"
            )}>
              {activeSection === 'main' ? 'Gerencie suas preferências e configurações do sistema' : 'Configure e personalize suas opções'}
            </p>
          </div>
        </div>
      </div>
      {/* Conteúdo principal */}
      <div className={cn(
        "flex-1 overflow-y-auto px-6 pb-6",
        isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
      )}>
        {renderSection()}
      </div>
    </div>
  );
};
