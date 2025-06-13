
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { SEOHead } from './SEOHead';
import { LayoutProvider } from './layout/LayoutProvider';
import { SEOProvider } from './layout/SEOProvider';
import { MainLayoutContainer } from './layout/MainLayoutContainer';
import { useLayout } from './layout/LayoutProvider';
import { AuthDebug } from './debug/AuthDebug';

const MainLayoutContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeSection } = useLayout();

  console.log('🔍 [MAIN_LAYOUT] Estado de autenticação:', { isAuthenticated });

  if (!isAuthenticated) {
    console.log('🔍 [MAIN_LAYOUT] Usuário não autenticado, mostrando LoginForm');
    return (
      <SEOHead 
        title="Login"
        description="Acesse o Glamour Chat Center. Sistema profissional de gestão de atendimento e comunicação."
        keywords="login, acesso, glamour chat center, atendimento"
      >
        <LoginForm />
        <AuthDebug />
      </SEOHead>
    );
  }

  console.log('🔍 [MAIN_LAYOUT] Usuário autenticado, mostrando layout principal');
  return (
    <SEOProvider activeSection={activeSection}>
      <MainLayoutContainer />
      <AuthDebug />
    </SEOProvider>
  );
};

export const MainLayout: React.FC = () => {
  console.log('🔍 [MAIN_LAYOUT] Renderizando MainLayout');
  
  return (
    <LayoutProvider>
      <MainLayoutContent />
    </LayoutProvider>
  );
};
