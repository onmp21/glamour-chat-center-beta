
import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Exams } from '@/components/Exams';
import { ReportsNew } from '@/components/reports/ReportsNew';
import { ReportCenter } from '@/components/ReportCenter';
import { UnifiedSettings } from '@/components/UnifiedSettings';
import { Mensagens } from '@/components/Mensagens';
import { useLayout } from './LayoutProvider';

interface ContentRendererProps {
  activeSection: string;
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
  toggleDarkMode?: () => void;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  activeSection,
  isDarkMode,
  onSectionChange,
  toggleDarkMode
}) => {
  const { urlParams } = useLayout();

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
      
      case 'settings':
        return <UnifiedSettings isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode || (() => {})} />;
      
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
