import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Brain, FileText, Download, Filter, Calendar, BarChart3 } from 'lucide-react';
import { ConversationService, ConversationData } from '@/services/ConversationService';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider } from '@/types/ai-providers';

interface IntelligentReportsProps {
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

interface ReportResult {
  content: string;
  metadata: {
    generated_at: string;
    provider_type: string;
    model: string;
    report_type: string;
    tokens_used: number;
    data_summary: any;
  };
}

export const IntelligentReports: React.FC<IntelligentReportsProps> = ({ isDarkMode }) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    report_type: 'conversations'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([]);

  // Carregar provedores e canais
  useEffect(() => {
    loadProviders();
    loadChannels();
  }, []);

  const loadProviders = async () => {
    try {
      const activeProviders = await AIProviderService.getActiveProviders();
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

  const generateReport = async () => {
    if (!selectedProvider) {
      setError('Selecione um provedor de IA');
      return;
    }

    setIsGenerating(true);
    setError('');
    setReportResult(null);

    try {
      // Buscar dados baseado no tipo de relatório
      let data: any;
      
      if (filters.report_type === 'conversations') {
        data = await ConversationService.getConversationsForLLMAnalysis(100, {
          channel_id: filters.channel_id,
          status: filters.status,
          date_from: filters.date_from,
          date_to: filters.date_to
        });
      } else if (filters.report_type === 'channels') {
        data = await ConversationService.getChannels();
      } else {
        // Para relatórios customizados, buscar dados gerais
        data = await ConversationService.getConversationsSummary({
          channel_id: filters.channel_id,
          status: filters.status,
          date_from: filters.date_from,
          date_to: filters.date_to
        });
      }

      // Buscar configuração do provedor
      const provider = providers.find(p => p.id === selectedProvider);
      if (!provider) {
        throw new Error('Provedor não encontrado');
      }

      // Fazer chamada para o backend
      const response = await fetch('https://5000-i441ei3btftqyelp9i0cb-33eec26f.manusvm.computer/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_config: {
            provider_type: provider.provider_type,
            api_key: provider.api_key,
            base_url: provider.base_url,
            default_model: provider.default_model
          },
          report_type: filters.report_type,
          data: data,
          custom_prompt: filters.custom_prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar relatório');
      }

      const result = await response.json();
      setReportResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportResult) return;

    const content = `# Relatório Inteligente

**Gerado em:** ${new Date(reportResult.metadata.generated_at).toLocaleString('pt-BR')}
**Provedor:** ${reportResult.metadata.provider_type}
**Modelo:** ${reportResult.metadata.model}
**Tipo:** ${reportResult.metadata.report_type}
**Tokens utilizados:** ${reportResult.metadata.tokens_used}

---

${reportResult.content}

---

*Relatório gerado automaticamente pelo Glamour Chat Center*
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${filters.report_type}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("h-full flex flex-col", isDarkMode ? "bg-[#212121]" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("p-6", isDarkMode ? "bg-[#212121]" : "bg-gray-50")}>
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10")}>
            <Brain size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Relatórios Inteligentes
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Gere insights automáticos usando inteligência artificial
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 pt-0 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtros e Configurações */}
          <div className="lg:col-span-1 space-y-6">
            <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
                  <Filter size={20} className="text-[#b5103c]" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provedor de IA */}
                <div>
                  <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Provedor de IA
                  </label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                      <SelectValue placeholder="Selecione um provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} ({provider.provider_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Relatório */}
                <div>
                  <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Tipo de Relatório
                  </label>
                  <Select value={filters.report_type} onValueChange={(value: any) => setFilters({...filters, report_type: value})}>
                    <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversations">Análise de Conversas</SelectItem>
                      <SelectItem value="channels">Análise de Canais</SelectItem>
                      <SelectItem value="custom">Relatório Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Canal */}
                <div>
                  <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Canal (Opcional)
                  </label>
                  <Select value={filters.channel_id || ''} onValueChange={(value) => setFilters({...filters, channel_id: value || undefined})}>
                    <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                      <SelectValue placeholder="Todos os canais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os canais</SelectItem>
                      {channels.map(channel => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                    Status (Opcional)
                  </label>
                  <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value || undefined})}>
                    <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Período */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      Data Início
                    </label>
                    <Input
                      type="date"
                      value={filters.date_from || ''}
                      onChange={(e) => setFilters({...filters, date_from: e.target.value || undefined})}
                      className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      Data Fim
                    </label>
                    <Input
                      type="date"
                      value={filters.date_to || ''}
                      onChange={(e) => setFilters({...filters, date_to: e.target.value || undefined})}
                      className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
                    />
                  </div>
                </div>

                {/* Prompt Personalizado */}
                {filters.report_type === 'custom' && (
                  <div>
                    <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      Prompt Personalizado
                    </label>
                    <Textarea
                      value={filters.custom_prompt || ''}
                      onChange={(e) => setFilters({...filters, custom_prompt: e.target.value})}
                      placeholder="Descreva que tipo de análise você gostaria..."
                      className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
                      rows={4}
                    />
                  </div>
                )}

                <Button 
                  onClick={generateReport} 
                  disabled={isGenerating || !selectedProvider}
                  className="w-full bg-[#b5103c] hover:bg-[#b5103c]/90 text-white"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-2">
            <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
                    <FileText size={20} className="text-[#b5103c]" />
                    Resultado
                  </CardTitle>
                  {reportResult && (
                    <Button
                      onClick={downloadReport}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex items-center gap-2",
                        isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : "border-gray-200"
                      )}
                    >
                      <Download size={16} />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto mb-4"></div>
                      <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                        Gerando relatório inteligente...
                      </p>
                    </div>
                  </div>
                )}

                {reportResult && (
                  <div className="space-y-4">
                    {/* Metadados */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className={cn(isDarkMode ? "bg-[#27272a] text-[#a1a1aa]" : "bg-gray-100")}>
                        {reportResult.metadata.provider_type}
                      </Badge>
                      <Badge variant="secondary" className={cn(isDarkMode ? "bg-[#27272a] text-[#a1a1aa]" : "bg-gray-100")}>
                        {reportResult.metadata.model}
                      </Badge>
                      <Badge variant="secondary" className={cn(isDarkMode ? "bg-[#27272a] text-[#a1a1aa]" : "bg-gray-100")}>
                        {reportResult.metadata.tokens_used} tokens
                      </Badge>
                      <Badge variant="secondary" className={cn(isDarkMode ? "bg-[#27272a] text-[#a1a1aa]" : "bg-gray-100")}>
                        {new Date(reportResult.metadata.generated_at).toLocaleString('pt-BR')}
                      </Badge>
                    </div>

                    {/* Conteúdo do relatório */}
                    <div className={cn(
                      "prose prose-sm max-w-none p-4 rounded-lg border",
                      isDarkMode 
                        ? "bg-[#27272a] border-[#3f3f46] prose-invert prose-headings:text-white prose-p:text-[#a1a1aa] prose-strong:text-white prose-li:text-[#a1a1aa]" 
                        : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="whitespace-pre-wrap">{reportResult.content}</div>
                    </div>
                  </div>
                )}

                {!reportResult && !isGenerating && !error && (
                  <div className="text-center py-12">
                    <BarChart3 size={48} className={cn("mx-auto mb-4", isDarkMode ? "text-[#3f3f46]" : "text-gray-300")} />
                    <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      Configure os filtros e clique em "Gerar Relatório" para começar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

