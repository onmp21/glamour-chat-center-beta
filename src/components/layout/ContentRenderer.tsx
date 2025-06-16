import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Exams } from '@/components/Exams';
import { ReportsNew } from '@/components/reports/ReportsNew';
import { ReportCenter } from '@/components/ReportCenter';
import { UnifiedSettings } from '@/components/UnifiedSettings';
import { Mensagens } from '@/components/Mensagens';
import { useLayout } from './LayoutProvider';
import { CredentialsSection } from '@/components/settings/CredentialsSection';

interface ContentRendererProps {
  activeSection: string;
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
  toggleDarkMode?: () => void;
}

const SETTINGS_SUBSECTIONS = [
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

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  activeSection,
  isDarkMode,
  onSectionChange,
  toggleDarkMode
}) => {
  const { urlParams } = useLayout();

  // Novo: interpretar navegação direta para subseções do settings
  // Aceita 'settings' ou qualquer um dos SETTINGS_SUBSECTIONS diretamente
  if (
    activeSection === 'settings' ||
    SETTINGS_SUBSECTIONS.includes(activeSection)
  ) {
    // Envia initialSection só se não for root 'settings'
    const initialSection = activeSection !== 'settings' ? activeSection : undefined;
    return (
      <UnifiedSettings
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode || (() => {})}
        initialSection={initialSection}
      />
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard isDarkMode={isDarkMode} onSectionSelect={onSectionChange} />;
      
      case 'mensagens':
        // Passar parâmetros da URL para o componente Mensagens
        const channelParam = urlParams.get('channel');
        const phoneParam = urlParams.get('phone');
        
        return (
          <Mensagens 
            isDarkMode={isDarkMode} 
            onSectionChange={onSectionChange}
            initialChannel={channelParam}
            initialPhone={phoneParam}
          />
        );
      
      case 'exams':
      case 'exames':
        return <Exams isDarkMode={isDarkMode} />;
      
      case 'reports':
        return <ReportCenter />;
      
      default:
        return <Dashboard isDarkMode={isDarkMode} onSectionSelect={onSectionChange} />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      {renderContent()}
    </div>
  );
};
