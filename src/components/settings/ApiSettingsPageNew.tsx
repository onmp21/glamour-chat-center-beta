// Arquivo: src/components/settings/ApiSettingsPageNew.tsx
// Este arquivo mostra como integrar o novo EvolutionApiManager

import React from 'react';
import { EvolutionApiManager } from './EvolutionApiManager';
import { useLayout } from '@/components/layout/LayoutProvider';

export const ApiSettingsPageNew: React.FC = () => {
  const { isDarkMode } = useLayout();

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Configurações da API Evolution</h1>
        <p className="text-gray-600">
          Configure e gerencie suas instâncias da API Evolution para envio de mensagens via WhatsApp.
        </p>
      </div>
      
      <section className={`shadow rounded-lg p-6 ${
        isDarkMode ? 'bg-[#18181b]' : 'bg-white'
      }`}>
        <EvolutionApiManager isDarkMode={isDarkMode} />
      </section>
    </div>
  );
};

// Para integrar no sistema existente, substitua o conteúdo de ApiSettingsPage.tsx por:
/*
import React from 'react';
import { EvolutionApiManager } from './EvolutionApiManager';
import { useLayout } from '@/components/layout/LayoutProvider';

export const ApiSettingsPage: React.FC = () => {
  const { isDarkMode } = useLayout();

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Configurações da API Evolution</h1>
        <p className="text-gray-600">
          Configure e gerencie suas instâncias da API Evolution para envio de mensagens via WhatsApp.
        </p>
      </div>
      
      <section className={`shadow rounded-lg p-6 ${
        isDarkMode ? 'bg-[#18181b]' : 'bg-white'
      }`}>
        <EvolutionApiManager isDarkMode={isDarkMode} />
      </section>
    </div>
  );
};
*/

