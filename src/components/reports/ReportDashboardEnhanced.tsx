
import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider, ReportResult, ReportHistory } from '@/types/ai-providers';
import { ConversationService } from '@/services/ConversationService';
import { IntelligentReportsService } from '@/services/IntelligentReportsService';
import { ReportStatsSection } from './ReportStatsSection';
import { ReportGenerator } from './ReportGenerator';
import { ReportDisplay } from './ReportDisplay';
import { ReportHistory as ReportHistoryComponent } from './ReportHistory';

interface ReportDashboardEnhancedProps {
  isDarkMode: boolean;
}

interface ReportFilters {
  channel_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  report_type: 'conversations' | 'channels' | 'custom';
  custom_prompt?: string;
}

export const ReportDashboardEnhanced: React.FC<ReportDashboardEnhancedProps> = ({
  isDarkMode
}) => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    report_type: 'conversations'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [recentReports, setRecentReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsThisMonth: 0,
    averageGenerationTime: 0
  });

  useEffect(() => {
    loadProviders();
    loadRecentReports();
  }, []);

  const loadProviders = async () => {
    try {
<<<<<<< HEAD
      console.log("📊 [ReportDashboardEnhanced] Carregando provedores de IA...");
=======
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0
      const activeProviders = await AIProviderService.getProviders();
      setProviders(activeProviders);
      if (activeProviders.length > 0) {
        setSelectedProvider(String(activeProviders[0].id));
<<<<<<< HEAD
        console.log("📊 [ReportDashboardEnhanced] Provedores carregados. Primeiro provedor selecionado:", activeProviders[0].id);
      } else {
        console.log("📊 [ReportDashboardEnhanced] Nenhum provedor de IA ativo encontrado.");
      }
    } catch (error) {
      console.error("Erro ao carregar provedores:", error);
=======
      }
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0
    }
  };

  const loadRecentReports = async () => {
    try {
      setLoading(true);
      const reports = await IntelligentReportsService.getReports();
      setRecentReports(reports);
      
      // Calculate stats
      const total = reports.length;
      const thisMonth = reports.filter(report => {
        const reportDate = new Date(report.created_at);
        const now = new Date();
        return reportDate.getMonth() === now.getMonth() && 
               reportDate.getFullYear() === now.getFullYear();
      }).length;
      
      const avgTime = reports.length > 0 
        ? reports.reduce((sum, r) => sum + (r.generation_time || 0), 0) / reports.length 
        : 0;
      
      setStats({
        totalReports: total,
        reportsThisMonth: thisMonth,
        averageGenerationTime: avgTime
      });
    } catch (error) {
      console.error('Erro ao carregar relatórios recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedProvider) {
      setError('Selecione um provedor de IA');
      return;
    }

    setIsGenerating(true);
    setError('');
    setReportResult(null);

    try {
      const result = await IntelligentReportsService.generateReport({
        provider_id: selectedProvider,
        report_type: filters.report_type,
        data: {},
        custom_prompt: filters.custom_prompt
      });
      
      setReportResult(result.result);
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso",
      });
      loadRecentReports();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (reportContent: string, reportType: string, reportId?: string) => {
    const filename = `relatorio_${reportType}_${reportId || new Date().toISOString().split('T')[0]}.md`;
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = (reportContent: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório</title>
            <style>
              body { font-family: sans-serif; margin: 20px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${reportContent}</pre>
            <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const clearReport = () => {
    setReportResult(null);
    setError('');
    setFilters({ report_type: 'conversations' });
    setSelectedProvider(providers.length > 0 ? String(providers[0].id) : '');
  };

  return (
    <div className={cn("h-full flex flex-col", isDarkMode ? "bg-background" : "bg-gray-50")}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BarChart3 size={32} className="text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className={cn(
                "text-3xl font-bold",
                isDarkMode ? "text-card-foreground" : "text-gray-900"
              )}>
                Relatórios Inteligentes
              </h1>
              <p className={cn(
                "text-lg",
                isDarkMode ? "text-muted-foreground" : "text-gray-600"
              )}>
                Gere insights automáticos usando inteligência artificial
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <ReportStatsSection 
        isDarkMode={isDarkMode}
        stats={stats}
        providers={providers}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Generator */}
            <ReportGenerator
              isDarkMode={isDarkMode}
              providers={providers}
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              filters={filters}
              setFilters={setFilters}
              isGenerating={isGenerating}
              onGenerateReport={generateReport}
              onClearReport={clearReport}
              hasReportResult={!!reportResult}
            />

            {/* Report Display */}
            <ReportDisplay
              isDarkMode={isDarkMode}
              reportResult={reportResult}
              onPrintReport={printReport}
              onDownloadReport={downloadReport}
            />
          </div>

          {/* Report History */}
          <ReportHistoryComponent
            isDarkMode={isDarkMode}
            recentReports={recentReports}
            onViewReport={setReportResult}
            onDownloadReport={downloadReport}
          />
        </div>
      </div>
    </div>
  );
};
