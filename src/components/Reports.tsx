import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportsProps {
  isDarkMode: boolean;
}

// Simple ReportService mock for now
const ReportService = {
  generateReport: async (query: string) => {
    return {
      id: Date.now().toString(),
      title: 'Relatório Gerado',
      content: `Relatório baseado na consulta: ${query}`,
      created_at: new Date().toISOString()
    };
  },
  getReportHistory: async () => {
    return [];
  }
};

export const Reports: React.FC<ReportsProps> = ({ isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    
    setGenerating(true);
    try {
      const report = await ReportService.generateReport(query);
      console.log('Report generated:', report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={cn("h-full flex flex-col", isDarkMode ? "bg-[#212121]" : "bg-gray-50")}>
      {/* Header alinhado à esquerda */}
      <div className={cn("p-6", isDarkMode ? "bg-[#212121]" : "bg-gray-50")}>
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
              className="bg-[#b5103c] hover:bg-[#940d31]"
            >
              {generating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </div>
        
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
