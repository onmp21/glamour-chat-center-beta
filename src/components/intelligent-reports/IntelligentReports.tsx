
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Download, Search, Filter, BarChart3, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IntelligentReportsProps {
  isDarkMode?: boolean;
}

export const IntelligentReports: React.FC<IntelligentReportsProps> = ({ isDarkMode = false }) => {
  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('conversations');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const reportTypes = [
    { value: 'conversations', label: 'Análise de Conversas', icon: MessageSquare },
    { value: 'channels', label: 'Performance de Canais', icon: BarChart3 },
    { value: 'exams', label: 'Relatório de Exames', icon: Users },
    { value: 'custom', label: 'Relatório Personalizado', icon: FileText },
  ];

  const generateReport = async () => {
    if (!query.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma consulta para gerar o relatório inteligente",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      console.log('🤖 [AI_REPORTS] Gerando relatório inteligente:', { query, reportType });

      // Buscar dados dependendo do tipo de relatório
      let reportData = {};
      
      if (reportType === 'conversations') {
        // Buscar dados de todas as tabelas de conversas
        const conversationTables = [
          'yelena_ai_conversas',
          'canarana_conversas', 
          'souto_soares_conversas',
          'joao_dourado_conversas',
          'america_dourada_conversas',
          'gerente_lojas_conversas',
          'gerente_externo_conversas'
        ];
        
        const conversationData = [];
        for (const table of conversationTables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(100);
            
            if (!error && data) {
              conversationData.push({
                table,
                messages: data.length,
                data: data.slice(0, 10) // Apenas uma amostra
              });
            }
          } catch (err) {
            console.warn(`Erro ao buscar dados de ${table}:`, err);
          }
        }
        
        reportData = { conversations: conversationData };
      } else if (reportType === 'channels') {
        const { data: channelsData } = await supabase
          .from('channels')
          .select('*');
        
        reportData = { channels: channelsData || [] };
      } else if (reportType === 'exams') {
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .limit(100);
        
        reportData = { exams: examsData || [] };
      }

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: 'default',
          report_type: reportType,
          data: reportData,
          custom_prompt: query.trim(),
          filters: {}
        }
      });

      if (error) {
        throw error;
      }

      if (data?.report) {
        setGeneratedReport(data.report);
        toast({
          title: "Sucesso",
          description: "Relatório inteligente gerado com sucesso!",
        });
      } else {
        throw new Error('Nenhum relatório foi retornado');
      }
    } catch (error) {
      console.error('❌ [AI_REPORTS] Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório inteligente: " + (error instanceof Error ? error.message : 'Erro desconhecido'),
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={cn("min-h-screen p-6", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("p-3 rounded-full", isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10")}>
            <Sparkles size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Relatórios Inteligentes
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
              Análises avançadas com IA para insights profundos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gerador de Relatórios */}
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
              <Sparkles className="h-5 w-5 text-[#b5103c]" />
              Gerar Relatório IA
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-zinc-400" : "text-gray-600"}>
              Use inteligência artificial para gerar insights detalhados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="report-type" className={isDarkMode ? "text-zinc-300" : "text-gray-700"}>
                Tipo de Relatório
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}>
                  {reportTypes.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className={cn(
                        isDarkMode ? "text-white hover:bg-[#3f3f46] focus:bg-[#3f3f46]" : "text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="query" className={isDarkMode ? "text-zinc-300" : "text-gray-700"}>
                Consulta para IA
              </Label>
              <Textarea
                id="query"
                placeholder="Descreva que tipo de análise você gostaria... Ex: 'Analise o desempenho dos canais na última semana'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className={cn(
                  isDarkMode 
                    ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-zinc-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                )}
              />
            </div>

            <Button 
              onClick={generateReport} 
              disabled={generating || !query.trim()}
              className="w-full bg-[#b5103c] hover:bg-[#940d31] text-white"
            >
              {generating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando com IA...
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório Gerado */}
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
              <FileText className="h-5 w-5 text-[#b5103c]" />
              Resultado
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-zinc-400" : "text-gray-600"}>
              Relatório gerado pela inteligência artificial
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedReport ? (
              <div className="space-y-4">
                <div className={cn(
                  "prose prose-sm max-w-none p-4 rounded-lg border",
                  isDarkMode 
                    ? "prose-invert bg-[#27272a] border-[#3f3f46]" 
                    : "bg-gray-50 border-gray-200"
                )}>
                  <pre className={cn(
                    "whitespace-pre-wrap text-sm",
                    isDarkMode ? "text-zinc-300" : "text-gray-700"
                  )}>
                    {generatedReport}
                  </pre>
                </div>
                <Button variant="outline" size="sm" className={cn(
                  isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
                )}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório
                </Button>
              </div>
            ) : (
              <div className={cn(
                "text-center py-12",
                isDarkMode ? "text-zinc-400" : "text-gray-500"
              )}>
                <FileText className="mx-auto h-12 w-12 opacity-30 mb-3" />
                <p>Nenhum relatório gerado ainda</p>
                <p className="text-sm mt-1">Use o gerador de relatórios para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Recentes */}
      <div className="mt-8">
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("text-xl font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Relatórios Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-center py-8",
              isDarkMode ? "text-zinc-400" : "text-gray-500"
            )}>
              <FileText className="mx-auto h-12 w-12 opacity-30 mb-3" />
              <p>Nenhum relatório gerado recentemente</p>
              <p className="text-sm mt-1">Gere um novo relatório para visualizá-lo aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
