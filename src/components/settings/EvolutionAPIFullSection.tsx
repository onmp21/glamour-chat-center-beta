
import React from 'react';
import { EvolutionApiSettings } from '@/components/EvolutionApiSettings';
import { ApiInstanceListEnhanced } from './ApiInstanceListEnhanced';

interface EvolutionAPIFullSectionProps {
  isDarkMode: boolean;
}

export const EvolutionAPIFullSection: React.FC<EvolutionAPIFullSectionProps> = ({
  isDarkMode
}) => {
  return (
    <div className="space-y-6">
      <EvolutionApiSettings 
        isDarkMode={isDarkMode}
        channelId="default"
      />
      <ApiInstanceListEnhanced isDarkMode={isDarkMode} />
    </div>
  );
};
