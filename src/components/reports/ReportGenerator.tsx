
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Zap, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIProvider } from '@/types/ai-providers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ReportGeneratorProps {
  isDarkMode: boolean;
  providers: AIProvider[];
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
  filters: any;
  setFilters: (filters: any) => void;
  isGenerating: boolean;
  onGenerateReport: () => void;
  onClearReport: () => void;
  hasReportResult: boolean;
  availableChannels: any[];
  channelsLoading: boolean;
}

const availableSheets = [
  { id: 'yelena_ai_conversas', name: 'Yelena AI', description: 'Conversas do assistente principal' },
  { id: 'canarana_conversas', name: 'Canarana', description: 'Conversas da loja Canarana' },
  { id: 'souto_soares_conversas', name: 'Souto Soares', description: 'Conversas da loja Souto Soares' },
  { id: 'joao_dourado_conversas', name: 'João Dourado', description: 'Conversas da loja João Dourado' },
  { id: 'america_dourada_conversas', name: 'América Dourada', description: 'Conversas da loja América Dourada' },
  { id: 'gerente_lojas_conversas', name: 'Gerente Lojas', description: 'Conversas do gerente de lojas' },
  { id: 'gerente_externo_conversas', name: 'Gerente Externo', description: 'Conversas do gerente externo' },
  { id: 'exams', name: 'Exames', description: 'Dados de agendamentos de exames' }
];

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  isDarkMode,
  providers,
  selectedProvider,
  setSelectedProvider,
  filters,
  setFilters,
  isGenerating,
  onGenerateReport,
  onClearReport,
  hasReportResult,
  availableChannels,
  channelsLoading
}) => {

  const [loadingStep, setLoadingStep] = React.useState<string>('');

  const handleSheetToggle = (sheetId: string, checked: boolean) => {
    const currentSheets = filters.selected_sheets || [];
    if (checked) {
      setFilters({
        ...filters,
        selected_sheets: [...currentSheets, sheetId]
      });
    } else {
      setFilters({
        ...filters,
        selected_sheets: currentSheets.filter((id: string) => id !== sheetId)
      });
    }
  };

  // Função para buscar dados reais das tabelas selecionadas
  const fetchTableData = async (tableName: string) => {
    console.log(`🔍 [REPORT_GENERATOR] Buscando dados da tabela: ${tableName}`);
    
    try {
      if (tableName === 'exams') {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .limit(50)
          .order('appointment_date', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } else {
        // Tabelas de conversas
        const { data, error } = await (supabase as any)
          .from(tableName)
          .select('session_id, message, nome_do_contato, tipo_remetente, read_at, mensagemtype')
          .limit(100)
          .order('read_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      }
    } catch (error) {
      console.error(`❌ [REPORT_GENERATOR] Erro ao buscar dados de ${tableName}:`, error);
      return [];
    }
  };

  const handleGenerateReport = async () => {
    console.log('🚀 [REPORT_GENERATOR] Iniciando geração de relatório...');
    
    try {
      // Validações básicas
      if (!selectedProvider) {
        toast({
          title: "Erro",
          description: "Selecione um provedor de IA",
          variant: "destructive"
        });
        return;
      }

      if (!filters.report_type) {
        toast({
          title: "Erro", 
          description: "Selecione um tipo de relatório",
          variant: "destructive"
        });
        return;
      }

      // Para relatórios que não são custom, validar seleção de tabelas
      if (filters.report_type !== 'custom' && (!filters.selected_sheets || filters.selected_sheets.length === 0)) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos uma tabela para análise",
          variant: "destructive"
        });
        return;
      }

      setLoadingStep('Buscando dados das tabelas...');

      // Buscar dados das tabelas selecionadas
      let tableData: Record<string, any[]> = {};
      
      if (filters.selected_sheets && filters.selected_sheets.length > 0) {
        for (const tableName of filters.selected_sheets) {
          console.log(`📊 [REPORT_GENERATOR] Processando tabela: ${tableName}`);
          const data = await fetchTableData(tableName);
          tableData[tableName] = data;
          
          // Validar se há dados suficientes
          if (data.length === 0) {
            console.warn(`⚠️ [REPORT_GENERATOR] Tabela ${tableName} não possui dados`);
          }
        }

        // Verificar se pelo menos uma tabela tem dados
        const totalRecords = Object.values(tableData).reduce((sum, records) => sum + records.length, 0);
        if (totalRecords === 0) {
          toast({
            title: "Aviso",
            description: "As tabelas selecionadas não possuem dados para análise",
            variant: "destructive"
          });
          return;
        }
      }

      setLoadingStep('Gerando relatório com IA...');

      console.log('✅ [REPORT_GENERATOR] Dados coletados, chamando edge function...');

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: selectedProvider,
          report_type: filters.report_type,
          custom_prompt: filters.custom_prompt,
          selected_sheets: filters.selected_sheets || [],
          table_data: tableData // Enviando dados reais das tabelas
        }
      });

      console.log('📊 [REPORT_GENERATOR] Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ [REPORT_GENERATOR] Erro na edge function:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar relatório: " + (error.message || 'Erro desconhecido'),
          variant: "destructive"
        });
        return;
      }

      if (data && data.success) {
        onGenerateReport();
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data?.error || 'Erro desconhecido na geração do relatório',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [REPORT_GENERATOR] Erro geral:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingStep('');
    }
  };

  return (
    <Card className={cn(isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "text-xl font-semibold flex items-center gap-2",
          isDarkMode ? "text-card-foreground" : "text-gray-900"
        )}>
          <FileText size={20} className="text-primary" />
          Gerador de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção do Provedor IA */}
        <div className="space-y-2">
          <Label className={cn(isDarkMode ? "text-card-foreground" : "text-gray-700")}>
            Provedor de IA
          </Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className={cn(isDarkMode ? "bg-background border-border" : "bg-white border-gray-200")}>
              <SelectValue placeholder="Selecione um provedor de IA" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={String(provider.id)}>
                  {provider.name} ({provider.provider_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Relatório */}
        <div className="space-y-2">
          <Label className={cn(isDarkMode ? "text-card-foreground" : "text-gray-700")}>
            Tipo de Relatório
          </Label>
          <Select 
            value={filters.report_type || 'conversations'} 
            onValueChange={(value) => setFilters({ ...filters, report_type: value, selected_sheets: [] })}
          >
            <SelectTrigger className={cn(isDarkMode ? "bg-background border-border" : "bg-white border-gray-200")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversations">Análise de Conversas</SelectItem>
              <SelectItem value="exams">Análise de Exames</SelectItem>
              <SelectItem value="custom">Relatório Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Planilhas - Agora também para custom */}
        <div className="space-y-3">
          <Label className={cn(isDarkMode ? "text-card-foreground" : "text-gray-700")}>
            Selecionar Tabelas {filters.report_type === 'custom' ? '(Opcional)' : ''}
          </Label>
          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
            {availableSheets
              .filter(sheet => 
                filters.report_type === 'exams' ? sheet.id === 'exams' : sheet.id !== 'exams'
              )
              .map((sheet) => (
              <div key={sheet.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border">
                <Checkbox
                  id={sheet.id}
                  checked={filters.selected_sheets?.includes(sheet.id) || false}
                  onCheckedChange={(checked) => handleSheetToggle(sheet.id, checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Label 
                    htmlFor={sheet.id} 
                    className={cn(
                      "text-sm font-medium cursor-pointer",
                      isDarkMode ? "text-card-foreground" : "text-gray-900"
                    )}
                  >
                    {sheet.name}
                  </Label>
                  <p className={cn(
                    "text-xs mt-1",
                    isDarkMode ? "text-muted-foreground" : "text-gray-500"
                  )}>
                    {sheet.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Personalizado */}
        {filters.report_type === 'custom' && (
          <div className="space-y-2">
            <Label className={cn(isDarkMode ? "text-card-foreground" : "text-gray-700")}>
              Prompt Personalizado
            </Label>
            <Textarea
              placeholder="Descreva que tipo de relatório você deseja gerar..."
              value={filters.custom_prompt || ''}
              onChange={(e) => setFilters({ ...filters, custom_prompt: e.target.value })}
              className={cn(
                "min-h-[100px] resize-none",
                isDarkMode ? "bg-background border-border" : "bg-white border-gray-200"
              )}
            />
          </div>
        )}

        {/* Indicador de Loading */}
        {loadingStep && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg",
            isDarkMode ? "bg-muted" : "bg-gray-100"
          )}>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              {loadingStep}
            </span>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !selectedProvider}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {loadingStep || 'Gerando...'}
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
          
          {hasReportResult && (
            <Button
              onClick={onClearReport}
              variant="outline"
              className={cn(isDarkMode ? "border-border hover:bg-accent" : "border-gray-200")}
            >
              <Trash2 size={16} className="mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
