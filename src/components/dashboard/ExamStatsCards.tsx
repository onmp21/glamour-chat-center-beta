import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Calendar, TrendingUp } from 'lucide-react';
interface ExamStats {
  totalExams: number;
  examsThisMonth: number;
  examsThisWeek: number;
}
interface ExamStatsCardsProps {
  isDarkMode: boolean;
  examStats: ExamStats;
  onCardClick?: (period: 'total' | 'month' | 'week') => void;
}
export const ExamStatsCards: React.FC<ExamStatsCardsProps> = ({
  isDarkMode,
  examStats,
  onCardClick
}) => {
  const cards = [{
    title: 'Total de Exames',
    value: examStats.totalExams,
    icon: FileText,
    period: 'total' as const
  }, {
    title: 'Este Mês',
    value: examStats.examsThisMonth,
    icon: Calendar,
    period: 'month' as const
  }, {
    title: 'Esta Semana',
    value: examStats.examsThisWeek,
    icon: TrendingUp,
    period: 'week' as const
  }];
  return <div className="space-y-4">
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => {
        const IconComponent = card.icon;
        const isClickable = !!onCardClick;
        return <div key={index} onClick={() => isClickable && onCardClick(card.period)} className={cn("rounded-lg border p-4 flex flex-col justify-between min-h-[100px] transition-all duration-200", isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200", isClickable && "cursor-pointer hover:shadow-lg transform hover:scale-105", isClickable && isDarkMode && "hover:bg-[#1f1f23]", isClickable && !isDarkMode && "hover:bg-gray-50")}>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#b5103c] text-white">
                  <IconComponent size={20} />
                </div>
                {isClickable && <div className={cn("text-xs opacity-0 transition-opacity", isDarkMode ? "text-zinc-400" : "text-gray-500", "hover:opacity-100")}>
                    Ver detalhes
                  </div>}
              </div>
              
              <div className="mt-4">
                <h3 className={cn("text-sm font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  {card.title}
                </h3>
                <p className={cn("text-2xl font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
                  {card.value}
                </p>
              </div>
            </div>;
      })}
      </div>
    </div>;
};