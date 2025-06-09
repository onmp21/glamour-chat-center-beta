
import React, { useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';

interface SEOProviderProps {
  activeSection: string;
  children: React.ReactNode;
}

export const SEOProvider: React.FC<SEOProviderProps> = ({ activeSection, children }) => {
  const seoConfig = useMemo(() => {
    const configs = {
      dashboard: {
        title: 'Painel de Controle',
        description: 'Central de controle do Glamour Chat Center. Gerencie conversas, monitore estatísticas e acesse todas as funcionalidades.',
        keywords: 'painel controle, chat center, gestão conversas, atendimento cliente'
      },
      channels: {
        title: 'Canais de Atendimento',
        description: 'Acesse todos os canais de atendimento disponíveis. Gerencie conversas por WhatsApp e outros canais de comunicação.',
        keywords: 'canais atendimento, whatsapp, comunicação, chat'
      },
      exames: {
        title: 'Gestão de Exames',
        description: 'Sistema completo para gestão de exames médicos. Consulte, edite e monitore exames de forma eficiente.',
        keywords: 'gestão exames, exames médicos, sistema médico'
      },
      settings: {
        title: 'Configurações',
        description: 'Configure suas preferências, gerencie usuários e personalize o sistema conforme suas necessidades.',
        keywords: 'configurações, preferências, gestão usuários, personalização'
      }
    };

    return configs[activeSection as keyof typeof configs] || configs.dashboard;
  }, [activeSection]);

  return (
    <SEOHead {...seoConfig}>
      {children}
    </SEOHead>
  );
};
