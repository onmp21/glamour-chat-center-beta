import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  Users,
  MessageCircle,
  TrendingUp,
  Filter,
  Plus,
  Eye,
  BarChart3,
  Loader2,
  Printer,
  Brain,
  Activity,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider, ReportResult, ReportHistory } from '@/types/ai-providers';
import { ConversationService } from '@/services/ConversationService';
import { IntelligentReportsService } from '@/services/IntelligentReportsService';

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
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    report_type: 'conversations'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([]);
  const [recentReports, setRecentReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsThisMonth: 0,
    averageGenerationTime: 0
  });

  // Carregar provedores, canais e histórico de relatórios ao montar
  useEffect(() => {
    loadProviders();
    loadChannels();
    loadRecentReports();
  }, []);

  const loadProviders = async () => {
    try {
      const activeProviders = await AIProviderService.getProviders();
      setProviders(activeProviders);
      if (activeProviders.length > 0) {
        setSelectedProvider(activeProviders[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
    }
  };

  const loadChannels = async () => {
    try {
      const channelsData = await ConversationService.getChannels();
      setChannels(channelsData);
    } catch (error) {
      console.error('Erro ao carregar canais:', error);
    }
  };

  const loadRecentReports = async () => {
    try {
      // Mock implementation for now
      setRecentReports([
        {
          id: '1',
          title: 'Relatório',
          prompt: 'Resumo das conversas de dezembro',
          generated_at: '2024-12-15T10:00:00Z',
          created_at: '2024-12-15T10:00:00Z',
          provider_used: 'OpenAI',
          provider_id: '1',
          provider_name: 'OpenAI',
          model_used: 'gpt-4',
          tokens_used: 1200,
          generation_time: 5.2,
          metadata: {},
          query: 'Análise de conversas',
          result: {
            id: '1',
            title: 'Relatório',
            content: 'Conteúdo',
            created_at: '2024-12-15T10:00:00Z',
            provider_id: '1',
            report_content: 'Relatório de conversas de dezembro...',
            report_type: 'conversations',
            status: 'completed'
          },
          timestamp: '2024-12-15T10:00:00Z',
          status: 'success',
          report_type: 'conversations',
          generated_report: 'Relatório de conversas de dezembro...'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar relatórios recentes:', error);
    }
  };

  const fetchReports = async () => {
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
      console.error('Error fetching reports:', error);
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
      // Mock implementation for now
      const result: ReportResult = {
        id: Date.now().toString(),
        title: 'Relatório Gerado',
        content: `Relatório baseado na consulta: ${filters.custom_prompt || 'Análise padrão'}`,
        created_at: new Date().toISOString(),
        provider_id: selectedProvider,
        report_content: `Relatório baseado na consulta: ${filters.custom_prompt || 'Análise padrão'}`,
        report_type: filters.report_type,
        status: 'completed'
      };
      
      setReportResult(result);
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
    setSelectedProvider(providers.length > 0 ? providers[0].id : '');
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

      {/* Stats Rápidas */}
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
                  Tokens Utilizados (Mês)
                </span>
                <p className={cn("text-lg font-bold ml-auto", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                  ~50k
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gerador de Relatórios */}
            <Card className={cn("border shadow-sm", isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", isDarkMode ? "bg-accent" : "bg-gray-100")}>
                    <Brain size={18} className="text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                      Gerador de Relatórios Inteligentes
                    </CardTitle>
                    <CardDescription className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                      Descreva o relatório que deseja gerar com IA
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provedor de IA */}
                <div>
                  <Label htmlFor="ai-provider" className={cn("text-sm font-medium", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Provedor de IA
                  </Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className={cn(isDarkMode ? "bg-input-dark border-input-dark text-card-foreground" : "bg-white border-gray-200")}>
                      <SelectValue placeholder="Selecione um provedor" />
                    </SelectTrigger>
                    <SelectContent className={cn(isDarkMode ? "bg-card border-border text-card-foreground" : "bg-white text-gray-900")}>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} ({AIProviderService.getProviderTypeLabel(provider.provider_type)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Relatório */}
                <div>
                  <Label htmlFor="report-type" className={cn("text-sm font-medium", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Tipo de Relatório
                  </Label>
                  <Select value={filters.report_type} onValueChange={(value: any) => setFilters({ ...filters, report_type: value })}>
                    <SelectTrigger className={cn(isDarkMode ? "bg-input-dark border-input-dark text-card-foreground" : "bg-white border-gray-200")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={cn(isDarkMode ? "bg-card border-border text-card-foreground" : "bg-white text-gray-900")}>
                      <SelectItem value="conversations">Análise de Conversas</SelectItem>
                      <SelectItem value="channels">Análise de Canais</SelectItem>
                      <SelectItem value="custom">Relatório Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompt Personalizado */}
                {filters.report_type === 'custom' && (
                  <div>
                    <Label htmlFor="custom-prompt" className={cn("text-sm font-medium", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                      Prompt Personalizado
                    </Label>
                    <Textarea
                      id="custom-prompt"
                      value={filters.custom_prompt || ''}
                      onChange={(e) => setFilters({ ...filters, custom_prompt: e.target.value })}
                      placeholder="Descreva que tipo de análise você gostaria..."
                      className={cn(
                        "min-h-[100px] text-sm",
                        isDarkMode
                          ? "bg-input-dark border-input-dark text-card-foreground placeholder:text-muted-foreground"
                          : "bg-white border-gray-300"
                      )}
                      rows={4}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={generateReport}
                    disabled={isGenerating || !selectedProvider}
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar Relatório'
                    )}
                  </Button>
                  {reportResult && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearReport}
                      className={cn(
                        isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                      )}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Relatório Gerado */}
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
                        onClick={() => printReport(reportResult.report_content)}
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
                        onClick={() => downloadReport(reportResult.report_content, reportResult.report_type, reportResult.id)}
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
          </div>

          {/* Histórico de Relatórios */}
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
                          onClick={() => setReportResult({ 
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
                          onClick={() => downloadReport(report.generated_report, report.report_type, report.id)}
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
        </div>
      </div>
    </div>
  );
};
