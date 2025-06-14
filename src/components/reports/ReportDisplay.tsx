
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportResult } from '@/types/ai-providers';

interface ReportDisplayProps {
  isDarkMode: boolean;
  reportResult: ReportResult | null;
  onPrintReport: (content: string) => void;
  onDownloadReport: (content: string, type: string, id?: string) => void;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({
  isDarkMode,
  reportResult,
  onPrintReport,
  onDownloadReport
}) => {
  return (
    <Card className={cn("border shadow-sm", isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", isDarkMode ? "bg-accent" : "bg-gray-100")}>
              <FileText size={18} className="text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle className={cn("text-lg", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                Relatório Gerado
              </CardTitle>
            </div>
          </div>
          {reportResult && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintReport(reportResult.report_content)}
                className={cn(
                  isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                )}
              >
                <Printer size={14} className="mr-2" strokeWidth={1.5} />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadReport(reportResult.report_content, reportResult.report_type, reportResult.id)}
                className={cn(
                  isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                )}
              >
                <Download size={14} className="mr-2" strokeWidth={1.5} />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reportResult ? (
          <div className={cn(
            "p-3 rounded-lg border min-h-[200px] max-h-[400px] overflow-auto whitespace-pre-wrap text-sm",
            isDarkMode
              ? "bg-input-dark border-input-dark text-card-foreground"
              : "bg-gray-50 border-gray-200 text-gray-800"
          )}>
            {reportResult.report_content}
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center h-[200px] border-2 border-dashed rounded-lg",
            isDarkMode ? "border-border" : "border-gray-300"
          )}>
            <div className="text-center">
              <FileText size={32} className={cn(
                "mx-auto mb-2",
                isDarkMode ? "text-muted-foreground" : "text-gray-400"
              )} />
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>
                O relatório aparecerá aqui
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
