
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Brain, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIProvider } from '@/types/ai-providers';

interface ReportStatsSectionProps {
  isDarkMode: boolean;
  stats: {
    totalReports: number;
    reportsThisMonth: number;
    averageGenerationTime: number;
  };
  providers: any[];
  // There is no direct report_type prop, so no correction needed here unless used elsewhere.
}

export const ReportStatsSection: React.FC<ReportStatsSectionProps> = ({
  isDarkMode,
  stats,
  providers
}) => {
  return (
    <div className="p-6 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn(isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
            <CardContent className="p-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className={cn("text-sm font-medium", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                Relatórios Gerados
              </span>
              <p className={cn("text-lg font-bold ml-auto", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                {stats.totalReports}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
            <CardContent className="p-3 flex items-center gap-2">
              <Brain size={16} className="text-primary" />
              <span className={cn("text-sm font-medium", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                Provedores Ativos
              </span>
              <p className={cn("text-lg font-bold ml-auto", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                {providers.filter(p => p.is_active).length}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
            <CardContent className="p-3 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <span className={cn("text-sm font-medium", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                Tempo Médio (s)
              </span>
              <p className={cn("text-lg font-bold ml-auto", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                {stats.averageGenerationTime}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
