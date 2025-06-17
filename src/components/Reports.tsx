
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReportsProps {
  isDarkMode: boolean;
}

export const Reports: React.FC<ReportsProps> = ({ isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!query.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma consulta para gerar o relatório",
        variant: "destructive"
      });
      return;
    }
    
    setGenerating(true);
    
    try {
      console.log('🔄 [REPORTS] Gerando relatório com query:', query);
      
      // Buscar dados mockados para o relatório
      const mockData = {
        conversations: [],
        channels: [],
        query: query.trim()
      };

      // Chamar a função de geração de relatório
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: 'default',
          report_type: 'custom',
          data: mockData,
          custom_prompt: query.trim(),
          filters: {}
        }
      });

      if (error) {
        console.error('❌ [REPORTS] Erro ao gerar relatório:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar relatório: " + error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.report) {
        console.log('✅ [REPORTS] Relatório gerado com sucesso');
        setGeneratedReport(data.report);
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso",
        });
      } else {
        throw new Error('Nenhum relatório retornado');
      }
    } catch (error) {
      console.error('❌ [REPORTS] Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={cn("h-full flex flex-col", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      {/* Header alinhado à esquerda */}
      <div className={cn("p-6", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10")}>
            <TrendingUp size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Relatórios
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Análise de dados e estatísticas
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-6 overflow-auto">
        <div className={cn(
          "rounded-lg border p-6 mb-6",
          isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200"
        )}>
          <h2 className={cn(
            "text-xl font-semibold mb-4",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Gerar Relatório Personalizado
          </h2>
          
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="query-input" 
                className={cn(
                  "block text-sm font-medium mb-1",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}
              >
                Consulta
              </label>
              <input
                id="query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite sua consulta para relatório..."
                className={cn(
                  "w-full p-3 rounded-md border",
                  isDarkMode 
                    ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                )}
              />
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={generating || !query.trim()}
              className="bg-[#b5103c] hover:bg-[#940d31] text-white"
            >
              {generating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando...
                </div>
              ) : (
                'Gerar Relatório'
              )}
            </Button>
          </div>
        </div>
        
        {/* Relatório Gerado */}
        {generatedReport && (
          <div className={cn(
            "rounded-lg border p-6 mb-6",
            isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200"
          )}>
            <h2 className={cn(
              "text-xl font-semibold mb-4",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Relatório Gerado
            </h2>
            <div className={cn(
              "prose prose-sm max-w-none",
              isDarkMode ? "prose-invert" : ""
            )}>
              <pre className={cn(
                "whitespace-pre-wrap text-sm",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                {generatedReport}
              </pre>
            </div>
          </div>
        )}
        
        <div className={cn(
          "rounded-lg border p-6",
          isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200"
        )}>
          <h2 className={cn(
            "text-xl font-semibold mb-4",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Relatórios Recentes
          </h2>
          
          <div className={cn(
            "text-center py-8",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            <FileText className="mx-auto h-12 w-12 opacity-30 mb-3" />
            <p>Nenhum relatório gerado recentemente</p>
            <p className="text-sm mt-1">Gere um novo relatório para visualizá-lo aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
};
