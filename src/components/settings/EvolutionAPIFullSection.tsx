
import React from 'react';
import { ApiInstanceListEnhanced } from './ApiInstanceListEnhanced';

interface EvolutionAPIFullSectionProps {
  isDarkMode: boolean;
}

export const EvolutionAPIFullSection: React.FC<EvolutionAPIFullSectionProps> = ({
  isDarkMode
}) => {
  return (
    <div className="space-y-6">
      <ApiInstanceListEnhanced isDarkMode={isDarkMode} />
    </div>
  );
};
