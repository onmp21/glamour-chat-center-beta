
import React from 'react';
import { EvolutionApiSettings } from '@/components/EvolutionApiSettings';
import { ApiInstanceListEnhanced } from '@/components/settings/ApiInstanceListEnhanced';
import { Separator } from '@/components/ui/separator';

interface EvolutionAPIFullSectionProps {
  isDarkMode: boolean;
}

export const EvolutionAPIFullSection: React.FC<EvolutionAPIFullSectionProps> = ({
  isDarkMode
}) => {
  return (
    <div className="space-y-8">
      {/* Configurações da API Evolution */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Configurar Nova Instância
        </h3>
        <EvolutionApiSettings 
          isDarkMode={isDarkMode}
          channelId="default"
        />
      </div>

      <Separator className={isDarkMode ? 'bg-[#3f3f46]' : 'bg-gray-200'} />

      {/* Lista de Instâncias Existentes */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Gerenciar Instâncias
        </h3>
        <ApiInstanceListEnhanced isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};
