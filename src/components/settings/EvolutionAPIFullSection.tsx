
import React from 'react';
import { cn } from '@/lib/utils';
import { ApiInstanceListEnhanced } from './ApiInstanceListEnhanced';

interface EvolutionAPIFullSectionProps {
  isDarkMode: boolean;
}

export const EvolutionAPIFullSection: React.FC<EvolutionAPIFullSectionProps> = ({
  isDarkMode
}) => {
  return (
    <div className={cn(
      "space-y-6",
      isDarkMode ? "bg-[#09090b] text-[#ffffff]" : "bg-gray-50 text-gray-900"
    )}>
      <div className={cn(
        "p-6 rounded-xl border",
        isDarkMode 
          ? "bg-[#18181b] border-[#27272a] text-[#ffffff]" 
          : "bg-white border-gray-200 text-gray-900"
      )}>
        <div className="mb-6">
          <h3 className={cn(
            "text-xl font-semibold mb-2",
            isDarkMode ? "text-[#ffffff]" : "text-gray-900"
          )}>
            Configuração da API Evolution
          </h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-[#9ca3af]" : "text-gray-600"
          )}>
            Gerencie suas instâncias da API Evolution para integração com WhatsApp
          </p>
        </div>
        
        <ApiInstanceListEnhanced isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};
