
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  isDarkMode: boolean;
  onSettings?: () => void;
  onNotifications?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDarkMode,
  onSettings,
  onNotifications
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className={cn(
          "text-2xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Métricas do Sistema
        </h1>
        <p className={cn(
          "text-sm mt-1",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Acompanhe o desempenho e estatísticas em tempo real
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNotifications}
          className={cn(
            "btn-animate",
            isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Bell size={18} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className={cn(
            "btn-animate",
            isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Settings size={18} />
        </Button>
      </div>
    </div>
  );
};
