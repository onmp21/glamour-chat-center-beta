
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { EnhancedReportPDFService } from '@/services/EnhancedReportPDFService';

interface ReportPreviewModalProps {
  reportId: string;
  isDarkMode: boolean;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  reportId,
  isDarkMode,
  onClose
}) => {
  const reportData = EnhancedReportPDFService.generateMockData(reportId);

  const handleDownload = () => {
    const doc = EnhancedReportPDFService.generatePDF(reportData);
    EnhancedReportPDFService.downloadPDF(doc, `${reportData.title.replace(/\s+/g, '_')}_preview`);
  };

  const renderExecutiveSummary = () => {
    if (!reportData.summary) return null;

    const { summary } = reportData;
    
    return (
      <Card className={cn(
        "border shadow-sm mb-6",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className={cn("text-lg flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
            <TrendingUp className="w-5 h-5 text-[#b5103c]" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportData.category === 'Conversas' && (
              <>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Total de Conversas
                  </p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {summary.totalConversations}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Resolvidas
                  </p>
                  <p className={cn("text-2xl font-bold text-green-600")}>
                    {summary.resolvedConversations}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Tempo Médio
                  </p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {summary.averageResponseTime}
                  </p>
                </div>
              </>
            )}
            
            {reportData.category === 'Exames' && (
              <>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Total de Exames
                  </p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {summary.totalExams}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Completados
                  </p>
                  <p className={cn("text-2xl font-bold text-green-600")}>
                    {summary.completedExams}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Tempo de Espera
                  </p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {summary.averageWaitTime}
                  </p>
                </div>
              </>
            )}

            {reportData.category === 'Performance' && (
              <>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Uptime
                  </p>
                  <p className={cn("text-2xl font-bold text-green-600")}>
                    {summary.systemUptime}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Tempo de Carga
                  </p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {summary.averageLoadTime}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-[#27272a]" : "bg-gray-50")}>
                  <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Taxa de Erro
                  </p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {summary.errorRate}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCharts = () => {
    if (!reportData.charts) return null;

    return (
      <Card className={cn(
        "border shadow-sm mb-6",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className={cn("text-lg flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
            <BarChart3 className="w-5 h-5 text-[#b5103c]" />
            Análise Gráfica
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.charts.channels && (
            <div className="mb-6">
              <h4 className={cn("font-medium mb-3", isDarkMode ? "text-white" : "text-gray-900")}>
                Conversas por Canal
              </h4>
              <div className="space-y-2">
                {reportData.charts.channels.map((channel: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      {channel.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-[#b5103c] rounded"
                        style={{ width: `${(channel.conversations / 60) * 100}px` }}
                      />
                      <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                        {channel.conversations}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportData.charts.examTypes && (
            <div className="mb-6">
              <h4 className={cn("font-medium mb-3", isDarkMode ? "text-white" : "text-gray-900")}>
                Distribuição de Tipos de Exame
              </h4>
              <div className="space-y-2">
                {reportData.charts.examTypes.map((exam: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      {exam.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {exam.percentage}%
                      </Badge>
                      <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                        {exam.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDataTable = () => {
    if (!reportData.data || reportData.data.length === 0) return null;

    const headers = Object.keys(reportData.data[0]);

    return (
      <Card className={cn(
        "border shadow-sm",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className={cn("text-lg flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
            <PieChart className="w-5 h-5 text-[#b5103c]" />
            Dados Detalhados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isDarkMode ? "border-[#3f3f46]" : "border-gray-200")}>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className={cn(
                        "text-left py-2 px-3 font-medium",
                        isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                      )}
                    >
                      {header.charAt(0).toUpperCase() + header.slice(1).replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.data.slice(0, 5).map((row: any, rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b",
                      isDarkMode ? "border-[#3f3f46]" : "border-gray-100",
                      rowIndex % 2 === 0 && (isDarkMode ? "bg-[#27272a]" : "bg-gray-50")
                    )}
                  >
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "py-2 px-3",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}
                      >
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.data.length > 5 && (
              <p className={cn("text-xs mt-2", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                ... e mais {reportData.data.length - 5} registros no PDF completo
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-4xl max-h-[90vh] m-4 rounded-lg border shadow-lg overflow-hidden",
        isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        {/* Header */}
        <div className={cn(
          "sticky top-0 z-10 flex items-center justify-between p-4 border-b",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <div>
            <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Preview: {reportData.title}
            </h2>
            <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              {reportData.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {renderExecutiveSummary()}
          {renderCharts()}
          {renderDataTable()}
        </div>
      </div>
    </div>
  );
};
