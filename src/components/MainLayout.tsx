
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { SEOHead } from './SEOHead';
import { LayoutProvider } from './layout/LayoutProvider';
import { SEOProvider } from './layout/SEOProvider';
import { MainLayoutContainer } from './layout/MainLayoutContainer';
import { useLayout } from './layout/LayoutProvider';

const MainLayoutContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeSection } = useLayout();

  if (!isAuthenticated) {
    return (
      <SEOHead 
        title="Login"
        description="Acesse o Glamour Chat Center. Sistema profissional de gestão de atendimento e comunicação."
        keywords="login, acesso, glamour chat center, atendimento"
      >
        <LoginForm />
      </SEOHead>
    );
  }

  return (
    <SEOProvider activeSection={activeSection}>
      <MainLayoutContainer />
    </SEOProvider>
  );
};

export const MainLayout: React.FC = () => {
  return (
    <LayoutProvider>
      <MainLayoutContent />
    </LayoutProvider>
  );
};
