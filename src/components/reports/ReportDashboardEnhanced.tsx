
import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider } from '@/types/ai-providers';
import { IntelligentReportsService, ReportResult, ReportHistory } from '@/services/IntelligentReportsService';
import { ReportStatsSection } from './ReportStatsSection';
import { ReportGenerator } from './ReportGenerator';
import { ReportDisplay } from './ReportDisplay';
import { ReportHistory as ReportHistoryComponent } from './ReportHistory';
import { useActiveChannels } from '@/hooks/useActiveChannels';

interface ReportDashboardEnhancedProps {
  isDarkMode: boolean;
}

export const ReportDashboardEnhanced: React.FC<ReportDashboardEnhancedProps> = ({
  isDarkMode
}) => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [filters, setFilters] = useState<any>({
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
  const { channels: availableChannels, loading: channelsLoading } = useActiveChannels();

  // Função utilitária para formatar segundos em mm:ss
  function formatSeconds(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0s";
    return `${Math.round(seconds)}s`;
  }

  // CORRIGIDO: Usar import dinâmico ao invés de require
  async function fetchReportData(report_type: string, channel_id?: string) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      if (report_type === 'conversations' && channel_id) {
        // Buscar até 30 conversas recentes do canal selecionado
        const { getTableNameForChannel } = await import('@/utils/channelMapping');
        const tableName = getTableNameForChannel(channel_id);
        const { data } = await supabase
          .from(tableName)
          .select('session_id, message, nome_do_contato, tipo_remetente, read_at')
          .limit(30)
          .order('read_at', { ascending: false });
        return data || [];
      }
      if (report_type === 'exams') {
        // Buscar até 30 exames
        const { data } = await supabase
          .from('exams')
          .select('*')
          .limit(30)
          .order('appointment_date', { ascending: false });
        return data || [];
      }
      return {}; // Para custom, retorna vazio
    } catch (error) {
      console.error('❌ [REPORT_DATA] Erro ao buscar dados:', error);
      return {};
    }
  }

  useEffect(() => {
    loadProviders();
    loadRecentReports();
  }, []);

  const loadProviders = async () => {
    try {
      console.log("📊 [ReportDashboardEnhanced] Carregando provedores de IA...");
      const activeProviders = await AIProviderService.getProviders();
      setProviders(activeProviders || []);
      if (activeProviders && activeProviders.length > 0) {
        setSelectedProvider(String(activeProviders[0].id));
        console.log("📊 [ReportDashboardEnhanced] Provedores carregados. Primeiro provedor selecionado:", activeProviders[0].id);
      } else {
        setSelectedProvider('');
        console.log("📊 [ReportDashboardEnhanced] Nenhum provedor de IA ativo encontrado.");
      }
    } catch (error) {
      setSelectedProvider('');
      console.error("Erro ao carregar provedores:", error);
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
      setError('É necessário cadastrar e selecionar ao menos um provedor de IA ativo antes de gerar relatórios.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setReportResult(null);

    try {
      // CORRIGIDO: Busca dados REAIS conforme tipo do relatório usando import dinâmico
      let reportData: any = {};
      if (filters.report_type === "conversations" || filters.report_type === "exams") {
        reportData = await fetchReportData(filters.report_type, filters.channel_id);
      }
      
      const result = await IntelligentReportsService.generateReport({
        provider_id: selectedProvider,
        report_type: filters.report_type,
        data: reportData,
        custom_prompt: filters.custom_prompt,
        selected_sheets: filters.selected_sheets
      });

      if (!result.success || !result.result) {
        setError(result.error || 'Erro desconhecido na geração do relatório');
        setReportResult(null);
      } else {
        // Exibe mensagem customizada se houver erro no conteúdo do relatório
        if (
          result.result.generated_report?.includes("Erro: Nenhum provedor de IA configurado")
          || result.result.generated_report?.includes("chave de API")
          || result.result.generated_report?.toLowerCase().startsWith("falha ao gerar relatório")
        ) {
          setError(result.result.generated_report);
          setReportResult(null);
        } else {
          setReportResult(result.result);
          toast({
            title: "Sucesso",
            description: "Relatório gerado com sucesso",
          });
          loadRecentReports();
        }
      }
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
          {/* Generator e Display juntos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              availableChannels={availableChannels}
              channelsLoading={channelsLoading}
            />
            <ReportDisplay
              isDarkMode={isDarkMode}
              reportResult={reportResult}
              onPrintReport={printReport}
              onDownloadReport={downloadReport}
            />
          </div>
          {/* Relatórios Recentes fora do card, com margem em cima */}
          <div className="mt-10">
            <ReportHistoryComponent
              isDarkMode={isDarkMode}
              recentReports={recentReports}
              onViewReport={setReportResult}
              onDownloadReport={downloadReport}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
