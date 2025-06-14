
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIProvider } from '@/types/ai-providers';
import { AIProviderService } from '@/services/AIProviderService';

interface ReportFilters {
  channel_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  report_type: 'conversations' | 'channels' | 'custom';
  custom_prompt?: string;
}

interface ReportGeneratorProps {
  isDarkMode: boolean;
  providers: AIProvider[];
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  isGenerating: boolean;
  onGenerateReport: () => void;
  onClearReport: () => void;
  hasReportResult: boolean;
}

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
  hasReportResult
}) => {
  return (
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
                <SelectItem key={provider.id} value={String(provider.id)}>
                  {provider.name} ({AIProviderService.getProviderTypeLabel(provider.provider_type)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            onClick={onGenerateReport}
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
          {hasReportResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearReport}
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
  );
};
