
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { SEOHead } from './SEOHead';
import { LayoutProvider } from './layout/LayoutProvider';
import { SEOProvider } from './layout/SEOProvider';
import { MainLayoutContainer } from './layout/MainLayoutContainer';
import { useLayout } from './layout/LayoutProvider';

const MainLayoutContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { activeSection } = useLayout();

  console.log('🔍 [MAIN_LAYOUT] Verificando autenticação:', { 
    isAuthenticated, 
    user: user?.name,
    activeSection 
  });

  if (!isAuthenticated) {
    console.log('🔍 [MAIN_LAYOUT] Usuário não autenticado - mostrando LoginForm');
    return (
      <SEOHead 
        title="Login - Villa Glamour"
        description="Acesse o sistema de atendimento Villa Glamour"
        keywords="login, acesso, villa glamour, atendimento"
      >
        <LoginForm />
      </SEOHead>
    );
  }

  console.log('✅ [MAIN_LAYOUT] Usuário autenticado - mostrando aplicação principal');
  return (
    <SEOProvider activeSection={activeSection}>
      <MainLayoutContainer />
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
