
import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavigation } from '@/components/MobileNavigation';
import { ContentRenderer } from './ContentRenderer';
import { useLayout } from './LayoutProvider';
import { GlobalConversationStatsProvider } from '@/contexts/GlobalConversationStatsContext';

export const MainLayoutContainer: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    isSidebarVisible,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isDarkMode,
    toggleDarkMode
  } = useLayout();

  const [targetConversationId, setTargetConversationId] = useState<string | null>(null);

  const chatChannels = useMemo(() => [
    'chat', 'canarana', 'souto-soares', 'joao-dourado',
    'america-dourada', 'gerente-lojas', 'gerente-externo'
  ], []);

  // Controlar o estado do menu baseado na aba ativa
  useEffect(() => {
    if (activeSection === 'dashboard') {
      // Sempre expandido na aba painel
      setIsSidebarCollapsed(false);
    } else {
      // Recolhido nas outras abas
      setIsSidebarCollapsed(true);
    }
  }, [activeSection, setIsSidebarCollapsed]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const toggleSidebarCollapse = () => {
    // Só permitir recolher se não estiver na aba painel
    if (activeSection !== 'dashboard') {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <GlobalConversationStatsProvider>
      <div className={cn(
        "flex h-screen transition-colors overflow-hidden",
        isDarkMode && "dark"
      )} style={{
        backgroundColor: isDarkMode ? 'hsl(var(--background))' : '#f9fafb'
      }}>
        {/* Desktop Sidebar - sempre visível em telas grandes */}
        <div className="hidden lg:block">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            isVisible={true}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            showCollapseButton={activeSection !== 'dashboard'}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="h-full">
            <ContentRenderer
              activeSection={activeSection}
              isDarkMode={isDarkMode}
              onSectionChange={handleSectionChange}
              toggleDarkMode={toggleDarkMode}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav role="navigation" aria-label="Navegação mobile" className="lg:hidden">
          <MobileNavigation
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            isDarkMode={isDarkMode}
          />
        </nav>
      </div>
    </GlobalConversationStatsProvider>
  );
};
