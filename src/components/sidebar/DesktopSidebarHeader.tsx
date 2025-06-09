
import React from 'react';
import { cn } from '@/lib/utils';

interface DesktopSidebarHeaderProps {
  isDarkMode: boolean;
}

export const DesktopSidebarHeader: React.FC<DesktopSidebarHeaderProps> = ({ 
  isDarkMode 
}) => {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#b5103c] to-[#8a0c2e] rounded-xl flex items-center justify-center shadow-lg">
          <img 
            src="/lovable-uploads/63318fcc-a543-4299-aa65-5274d6eb987e.png" 
            alt="Villa Glamour Logo" 
            className="w-8 h-8 object-contain"
          />
        </div>
        <div>
          <h1 className={cn(
            "text-xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Villa Glamour
          </h1>
          <p className={cn(
            "text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            Sistema de Atendimento
          </p>
        </div>
      </div>
    </div>
  );
};
