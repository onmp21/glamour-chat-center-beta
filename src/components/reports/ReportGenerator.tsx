
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Zap, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIProvider } from '@/types/ai-providers';

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

// NOVO: Dados das planilhas disponíveis
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
          {providers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum provedor de IA configurado. Configure um provedor primeiro.
            </p>
          )}
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

        {/* NOVA: Seleção de Planilhas */}
        {(filters.report_type === 'conversations' || filters.report_type === 'exams') && (
          <div className="space-y-3">
            <Label className={cn(isDarkMode ? "text-card-foreground" : "text-gray-700")}>
              Selecionar Planilhas (múltipla seleção)
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
            <p className="text-xs text-muted-foreground">
              Selecione uma ou mais planilhas para análise
            </p>
          </div>
        )}

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

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onGenerateReport}
            disabled={isGenerating || !selectedProvider}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando...
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
