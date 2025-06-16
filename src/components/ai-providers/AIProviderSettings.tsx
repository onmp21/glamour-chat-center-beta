
import React from 'react';
import { AIProviderList } from './AIProviderList';

interface AIProviderSettingsProps {
  isDarkMode: boolean;
}

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ isDarkMode }) => {
  return (
    <div className={isDarkMode ? "bg-[#18181b] p-6 rounded-xl" : "bg-white border border-gray-200 p-6 rounded-xl"}>
      <AIProviderList isDarkMode={isDarkMode} />
    </div>
  );
};
