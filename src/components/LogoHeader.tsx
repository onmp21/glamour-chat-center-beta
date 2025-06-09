
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoHeaderProps {
  isDarkMode: boolean;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ isDarkMode }) => {
  return (
    <div className="flex items-center justify-center py-4 px-4 border-b mb-4" style={{
      borderColor: isDarkMode ? "#2a2a2a" : "#e5e7eb"
    }}>
      <div className="flex items-center space-x-3">
        <img 
          src="/lovable-uploads/2e823263-bd82-49e9-84f6-6327c136da53.png" 
          alt="Villa Glamour Logo" 
          className="w-12 h-12 object-contain"
          style={{ background: 'transparent' }}
        />
        <div>
          <h1 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
            Villa Glamour
          </h1>
          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Centro de Atendimento
          </p>
        </div>
      </div>
    </div>
  );
};
