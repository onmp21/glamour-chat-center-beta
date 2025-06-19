
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, Users, MessageSquare, Download, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AIProviderService } from '@/services/AIProviderService';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const AVAILABLE_TABLES = [
  { id: 'yelena_ai_conversas', name: 'Yelena AI', icon: '🤖' },
  { id: 'canarana_conversas', name: 'Canarana', icon: '🏪' },
  { id: 'souto_soares_conversas', name: 'Souto Soares', icon: '🏪' },
  { id: 'joao_dourado_conversas', name: 'João Dourado', icon: '🏪' },
  { id: 'america_dourada_conversas', name: 'América Dourada', icon: '🏪' },
  { id: 'gerente_lojas_conversas', name: 'Gerente Lojas', icon: '👔' },
  { id: 'gerente_externo_conversas', name: 'Gerente Externo', icon: '👔' }
];

const REPORT_TYPES = [
  { value: 'conversation_summary', label: 'Resumo de Conversas', icon: MessageSquare },
  { value: 'customer_analysis', label: 'Análise de Clientes', icon: Users },
  { value: 'period_report', label: 'Relatório por Período', icon: Calendar },
  { value: 'custom_analysis', label: 'Análise Personalizada', icon: FileText }
];

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [reportType, setReportType] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

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

  const handleTableToggle = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const canGenerateReport = selectedTables.length > 0 && reportType && selectedProvider;

  const generateReport = async () => {
    if (!canGenerateReport) {
      toast({
        title: "Erro",
        description: "Selecione ao menos uma planilha, tipo de relatório e provedor de IA",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('📊 [REPORT_GENERATOR] Generating report with:', {
        tables: selectedTables,
        reportType,
        provider: selectedProvider
      });

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: selectedProvider,
          report_type: reportType,
          data: {
            tables: selectedTables,
            date_from: dateFrom,
            date_to: dateTo,
            custom_prompt: customPrompt
          }
        }
      });

      console.log('📊 [REPORT_GENERATOR] Response:', { data, error });

      if (error) {
        console.error('❌ [REPORT_GENERATOR] Error:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar relatório: " + (error.message || 'Erro desconhecido'),
          variant: "destructive"
        });
        return;
      }

      if (data && data.success) {
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso!",
        });
        
        // Close modal and show report
        onClose();
        
        // You could emit an event or call a callback to show the report
        // For now, we'll just log it
        console.log('Generated report:', data.report);
      } else {
        toast({
          title: "Erro",
          description: data?.error || 'Erro desconhecido na geração do relatório',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [REPORT_GENERATOR] Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-hidden",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2 text-xl",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            <Sparkles className="h-5 w-5 text-[#b5103c]" />
            Gerador de Relatórios com IA
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Seleção de Planilhas */}
          <Card className={cn(
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "text-lg flex items-center gap-2",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                <FileText className="h-4 w-4" />
                Selecionar Planilhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_TABLES.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedTables.includes(table.id)
                        ? isDarkMode
                          ? "bg-[#b5103c] border-[#b5103c] text-white"
                          : "bg-[#b5103c] border-[#b5103c] text-white"
                        : isDarkMode
                          ? "bg-[#18181b] border-[#3f3f46] hover:border-[#52525b]"
                          : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleTableToggle(table.id)}
                  >
                    <Checkbox 
                      checked={selectedTables.includes(table.id)}
                      onChange={() => {}}
                      className="pointer-events-none"
                    />
                    <span className="text-lg">{table.icon}</span>
                    <span className="text-sm font-medium">{table.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Relatório */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Relatório */}
            <Card className={cn(
              isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50"
            )}>
              <CardHeader>
                <CardTitle className={cn(
                  "text-lg",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Tipo de Relatório
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className={cn(
                    isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white"
                  )}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Período */}
                <div className="space-y-2">
                  <Label className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>
                    Período
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className={cn(
                        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white"
                      )}
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={cn(
                        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white"
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Personalizado */}
            <Card className={cn(
              isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50"
            )}>
              <CardHeader>
                <CardTitle className={cn(
                  "text-lg",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Prompt Personalizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descreva detalhes específicos para o relatório..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className={cn(
                    "min-h-[120px]",
                    isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white"
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              selectedTables.length > 0 ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"
            )}>
              {selectedTables.length} planilha{selectedTables.length !== 1 ? 's' : ''} selecionada{selectedTables.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={generateReport}
              disabled={!canGenerateReport || isGenerating}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
