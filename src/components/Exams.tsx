
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
  return (
    <div className={cn(
      "h-full flex flex-col",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* Header alinhado à esquerda */}
      <div className={cn(
        "p-6",
        isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10"
          )}>
            <Calendar size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn(
              "text-3xl font-bold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Exames de Vista
            </h1>
            <p className={cn(
              "text-lg",
              isDarkMode ? "text-[#9ca3af]" : "text-gray-600"
            )}>
              Gerencie agendamentos e consultas
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de exames */}
      <div className="flex-1">
        <ExamesTable isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};
