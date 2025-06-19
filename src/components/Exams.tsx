
import React from 'react';
import { ExamesTable } from './ExamesTable';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface ExamsProps {
  isDarkMode: boolean;
}

export const Exams: React.FC<ExamsProps> = ({
  isDarkMode
}) => {
  const handleSectionChange = (section: string) => {
    // Default implementation - can be customized if needed
    console.log('Section change requested:', section);
  };

  return (
    <div className={cn(
      "h-full flex flex-col min-h-screen",
      isDarkMode ? "bg-background" : "bg-gray-50"
    )}>
      {/* Header alinhado à esquerda */}
      <div className={cn(
        "p-6 border-b",
        isDarkMode ? "bg-background border-border" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            isDarkMode ? "bg-muted" : "bg-[#b5103c]/10"
          )}>
            <Calendar size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn(
              "text-3xl font-bold",
              isDarkMode ? "text-foreground" : "text-gray-900"
            )}>
              Exames de Vista
            </h1>
            <p className={cn(
              "text-lg",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Gerencie agendamentos e consultas
            </p>
          </div>
        </div>
      </div>
      {/* Tabela de exames */}
      <div className={cn("flex-1",
        isDarkMode ? "bg-background" : "bg-gray-50"
      )}>
        <ExamesTable isDarkMode={isDarkMode} onSectionChange={handleSectionChange} />
      </div>
    </div>
  );
};
