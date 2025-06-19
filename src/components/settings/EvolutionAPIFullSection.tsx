
import React from 'react';
import { EvolutionApiSettings } from '@/components/EvolutionApiSettings';

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
    </div>
  );
};
