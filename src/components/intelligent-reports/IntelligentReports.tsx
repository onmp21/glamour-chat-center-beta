
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Sparkles, Download, Search, Filter, BarChart3, MessageSquare, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IntelligentReportsProps {
  isDarkMode?: boolean;
}

export const IntelligentReports: React.FC<IntelligentReportsProps> = ({ isDarkMode = false }) => {
  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('conversations');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const availableChannels = [
    { id: 'yelena', name: 'Yelena', table: 'yelena_ai_conversas' },
    { id: 'canarana', name: 'Canarana', table: 'canarana_conversas' },
    { id: 'souto-soares', name: 'Souto Soares', table: 'souto_soares_conversas' },
    { id: 'joao-dourado', name: 'João Dourado', table: 'joao_dourado_conversas' },
    { id: 'america-dourada', name: 'América Dourada', table: 'america_dourada_conversas' },
    { id: 'gerente-lojas', name: 'Gerente das Lojas', table: 'gerente_lojas_conversas' },
    { id: 'gerente-externo', name: 'Gerente do Externo', table: 'gerente_externo_conversas' }
  ];

  const availableTables = [
    { id: 'conversations', name: 'Conversas', description: 'Dados de mensagens e conversas' },
    { id: 'channels', name: 'Canais', description: 'Informações dos canais' },
    { id: 'exams', name: 'Exames', description: 'Dados de exames médicos' },
    { id: 'users', name: 'Usuários', description: 'Dados de usuários do sistema' },
    { id: 'api_instances', name: 'Instâncias API', description: 'Configurações de API' }
  ];

  const reportTypes = [
    { value: 'conversations', label: 'Análise de Conversas', icon: MessageSquare },
    { value: 'channels', label: 'Análise de Canais', icon: BarChart3 },
    { value: 'exams', label: 'Análise de Exames', icon: Users },
    { value: 'custom', label: 'Relatório Personalizado', icon: FileText },
  ];

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleTableToggle = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const generateReport = async () => {
    if (!query.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma consulta para gerar o relatório inteligente",
        variant: "destructive"
      });
      return;
    }

    // Validar seleções baseadas no tipo de relatório
    if (reportType === 'conversations' && selectedChannels.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um canal para análise de conversas",
        variant: "destructive"
      });
      return;
    }

    if (reportType === 'custom' && selectedTables.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma tabela para relatório personalizado",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      console.log('🤖 [AI_REPORTS] Gerando relatório inteligente:', { query, reportType, selectedChannels, selectedTables });

      // Buscar dados dependendo do tipo de relatório
      let reportData = {};
      
      if (reportType === 'conversations') {
        // Buscar apenas dados dos canais selecionados, apenas coluna message
        const conversationData = [];
        const selectedChannelTables = availableChannels
          .filter(channel => selectedChannels.includes(channel.id))
          .map(channel => channel.table);
        
        for (const table of selectedChannelTables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('message, timestamp, tipo_remetente')
              .limit(200);
            
            if (!error && data) {
              conversationData.push({
                table,
                channel: availableChannels.find(c => c.table === table)?.name,
                messages: data.length,
                data: data
              });
            }
          } catch (err) {
            console.warn(`Erro ao buscar dados de ${table}:`, err);
          }
        }
        
        reportData = { conversations: conversationData };
      } else if (reportType === 'channels') {
        // Buscar dados completos de todos os canais selecionados
        const channelData = [];
        const selectedChannelTables = availableChannels
          .filter(channel => selectedChannels.includes(channel.id))
          .map(channel => channel.table);
        
        for (const table of selectedChannelTables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(100);
            
            if (!error && data) {
              channelData.push({
                table,
                channel: availableChannels.find(c => c.table === table)?.name,
                totalRecords: data.length,
                data: data
              });
            }
          } catch (err) {
            console.warn(`Erro ao buscar dados de ${table}:`, err);
          }
        }
        
        reportData = { channels: channelData };
      } else if (reportType === 'exams') {
        // Buscar dados da planilha de exames
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .limit(200);
        
        reportData = { exams: examsData || [] };
      } else if (reportType === 'custom') {
        // Buscar dados das tabelas selecionadas
        const customData = {};
        
        for (const tableId of selectedTables) {
          try {
            let tableName = '';
            if (tableId === 'conversations') {
              // Para conversas, buscar de todos os canais selecionados
              const conversationData = [];
              const selectedChannelTables = availableChannels
                .filter(channel => selectedChannels.includes(channel.id))
                .map(channel => channel.table);
              
              for (const table of selectedChannelTables) {
                const { data, error } = await supabase
                  .from(table)
                  .select('*')
                  .limit(100);
                
                if (!error && data) {
                  conversationData.push({
                    table,
                    channel: availableChannels.find(c => c.table === table)?.name,
                    data: data
                  });
                }
              }
              customData[tableId] = conversationData;
            } else {
              // Para outras tabelas
              tableName = tableId === 'channels' ? 'channels' :
                         tableId === 'exams' ? 'exams' :
                         tableId === 'users' ? 'users' :
                         tableId === 'api_instances' ? 'api_instances' : tableId;
              
              const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(100);
              
              if (!error && data) {
                customData[tableId] = data;
              }
            }
          } catch (err) {
            console.warn(`Erro ao buscar dados de ${tableId}:`, err);
          }
        }
        
        reportData = customData;
      }

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: 'default',
          report_type: reportType,
          data: reportData,
          custom_prompt: query.trim(),
          filters: {
            selectedChannels,
            selectedTables
          }
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
              Gere insights automáticos usando inteligência artificial
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
              Gerador de Relatório
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-zinc-400" : "text-gray-600"}>
              Descreva o relatório que deseja gerar com IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Seleção de Canais */}
            {(reportType === 'conversations' || reportType === 'channels' || reportType === 'custom') && (
              <div>
                <Label className={isDarkMode ? "text-zinc-300" : "text-gray-700"}>
                  Selecionar Canais
                </Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {availableChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel.id}
                        checked={selectedChannels.includes(channel.id)}
                        onCheckedChange={() => handleChannelToggle(channel.id)}
                        className={cn(
                          "border-2",
                          isDarkMode ? "border-zinc-600 data-[state=checked]:bg-[#b5103c] data-[state=checked]:border-[#b5103c]" : ""
                        )}
                      />
                      <Label 
                        htmlFor={channel.id} 
                        className={cn("text-sm cursor-pointer", isDarkMode ? "text-zinc-300" : "text-gray-700")}
                      >
                        {channel.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedChannels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedChannels.map((channelId) => {
                      const channel = availableChannels.find(c => c.id === channelId);
                      return (
                        <Badge 
                          key={channelId} 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            isDarkMode ? "bg-[#27272a] text-zinc-300 hover:bg-[#3f3f46]" : ""
                          )}
                        >
                          {channel?.name}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => handleChannelToggle(channelId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Seleção de Tabelas (apenas para relatório personalizado) */}
            {reportType === 'custom' && (
              <div>
                <Label className={isDarkMode ? "text-zinc-300" : "text-gray-700"}>
                  Selecionar Tabelas
                </Label>
                <div className="mt-2 space-y-2">
                  {availableTables.map((table) => (
                    <div key={table.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={table.id}
                        checked={selectedTables.includes(table.id)}
                        onCheckedChange={() => handleTableToggle(table.id)}
                        className={cn(
                          "border-2 mt-0.5",
                          isDarkMode ? "border-zinc-600 data-[state=checked]:bg-[#b5103c] data-[state=checked]:border-[#b5103c]" : ""
                        )}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={table.id} 
                          className={cn("text-sm cursor-pointer", isDarkMode ? "text-zinc-300" : "text-gray-700")}
                        >
                          {table.name}
                        </Label>
                        <p className={cn("text-xs", isDarkMode ? "text-zinc-500" : "text-gray-500")}>
                          {table.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTables.map((tableId) => {
                      const table = availableTables.find(t => t.id === tableId);
                      return (
                        <Badge 
                          key={tableId} 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            isDarkMode ? "bg-[#27272a] text-zinc-300 hover:bg-[#3f3f46]" : ""
                          )}
                        >
                          {table?.name}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => handleTableToggle(tableId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
              Relatório Gerado
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-zinc-400" : "text-gray-600"}>
              O relatório aparecerá aqui
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
                  )}
                >
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
                <p className="text-sm mt-1">Configure os parâmetros e gere um relatório</p>
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
