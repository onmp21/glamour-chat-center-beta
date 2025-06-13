
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportHistory as ReportHistoryType, ReportResult } from '@/types/ai-providers';

interface ReportHistoryProps {
  isDarkMode: boolean;
  recentReports: ReportHistoryType[];
  onViewReport: (result: ReportResult) => void;
  onDownloadReport: (content: string, type: string, id: string) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  isDarkMode,
  recentReports,
  onViewReport,
  onDownloadReport
}) => {
  return (
    <Card className={cn("border shadow-sm", isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", isDarkMode ? "bg-accent" : "bg-gray-100")}>
            <FileText size={18} className="text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className={cn("text-lg", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
              Histórico de Relatórios Recentes
            </CardTitle>
            <CardDescription className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
              Visualize e gerencie seus relatórios gerados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentReports.length === 0 ? (
          <div className={cn(
            "flex items-center justify-center h-[100px] border-2 border-dashed rounded-lg",
            isDarkMode ? "border-border" : "border-gray-300"
          )}>
            <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-500")}>
              Nenhum relatório recente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReports.map(report => (
              <div key={report.id} className={cn(
                "p-3 border rounded-lg flex items-center justify-between",
                isDarkMode ? "bg-input-dark border-input-dark" : "bg-gray-50 border-gray-200"
              )}>
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                    {report.prompt}
                  </p>
                  <p className={cn("text-xs", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Gerado em: {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReport({ 
                      ...report.result, 
                      report_content: report.generated_report,
                      report_type: report.report_type
                    })}
                    className={cn(
                      isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                    )}
                  >
                    <Eye size={14} className="mr-2" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadReport(report.generated_report, report.report_type, report.id)}
                    className={cn(
                      isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                    )}
                  >
                    <Download size={14} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
