import React, { useState } from 'react';
import { useEnhancedReports } from '../../hooks/useEnhancedReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, BarChart, Lightbulb, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportGeneratorProps {
  reportType: string;
  reportTitle: string;
  reportData: any[];
  period: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  isDarkMode: boolean;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  reportType,
  reportTitle,
  reportData,
  period,
  filters,
  isDarkMode
}) => {
  const { loading, error, reportResult, generateReport } = useEnhancedReports();
  const [activeTab, setActiveTab] = useState('report');

  const handleGenerateReport = async () => {
    await generateReport({
      type: reportType,
      title: reportTitle,
      period,
      filters,
      data: reportData
    });
  };

  const handleDownloadPDF = () => {
    if (!reportResult) return;

    // Criar um documento HTML temporário para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para baixar o relatório.');
      return;
    }

    // Adicionar estilos e conteúdo
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - ${format(new Date(period.start), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(period.end), 'dd/MM/yyyy', { locale: ptBR })}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 { font-size: 24px; margin-bottom: 16px; color: #b5103c; }
          h2 { font-size: 20px; margin-top: 24px; margin-bottom: 12px; }
          h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          p { margin-bottom: 16px; }
          ul, ol { margin-bottom: 16px; padding-left: 24px; }
          li { margin-bottom: 4px; }
          .header {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            margin-top: 24px;
            font-size: 12px;
            color: #718096;
            text-align: center;
          }
          @media print {
            body { font-size: 12px; }
            h1 { font-size: 18px; }
            h2 { font-size: 16px; }
            h3 { font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Período: ${format(new Date(period.start), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(period.end), 'dd/MM/yyyy', { locale: ptBR })}</p>
        </div>
        ${reportResult.htmlReport}
        <div class="footer">
          <p>Relatório gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })} • Glamour Chat Center</p>
        </div>
      </body>
      </html>
    `);

    // Imprimir o documento
    setTimeout(() => {
      printWindow.document.close();
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {!reportResult ? (
        <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#b5103c]" />
              Gerar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Tipo de Relatório</h3>
                <p className="text-sm text-muted-foreground">{reportTitle}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Período</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(period.start), 'dd/MM/yyyy', { locale: ptBR })} a {format(new Date(period.end), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              
              {filters && Object.keys(filters).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Filtros</h3>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(filters).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-1">Dados</h3>
                <p className="text-sm text-muted-foreground">
                  {reportData.length} registros disponíveis para análise
                </p>
              </div>
              
              <Button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando relatório...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </>
                )}
              </Button>
              
              {error && (
                <div className="text-sm text-red-500 mt-2">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {reportTitle}
            </h2>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="report" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Relatório
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Recomendações
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="report">
              <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
                <CardContent className="pt-6">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: reportResult.htmlReport }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="insights">
              <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-4">Insights da IA</h3>
                    <div className="whitespace-pre-line">
                      {reportResult.insights}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recommendations">
              <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
                    <ul className="space-y-2">
                      {reportResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="min-w-5 h-5 rounded-full bg-[#b5103c]/10 flex items-center justify-center text-[#b5103c] text-xs font-medium">
                            {index + 1}
                          </div>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

