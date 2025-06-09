import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2, BarChart3, PieChart, Activity, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportsProps {
  isDarkMode: boolean;
}

export const Reports: React.FC<ReportsProps> = ({ isDarkMode }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [htmlReport, setHtmlReport] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o tipo de relatório que deseja gerar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      const data = await response.json();
      setGeneratedReport(data.report);
      setHtmlReport(data.htmlReport || '');
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (!htmlReport) return;
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão permitidos.",
        variant: "destructive"
      });
      return;
    }
    
    // Adicionar estilos e conteúdo HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Glamour - ${new Date().toLocaleDateString('pt-BR')}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.5;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          
          @media print {
            body {
              background-color: white;
            }
            
            .no-print {
              display: none;
            }
            
            .report-container {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              max-width: 100% !important;
              margin: 0 !important;
            }
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #b5103c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .print-button:hover {
            background-color: #9d0e34;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimir
        </button>
        ${htmlReport}
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const clearReport = () => {
    setGeneratedReport('');
    setHtmlReport('');
    setPrompt('');
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      {/* Header livre sem fundo */}
      <div className="p-6 border-b border-[#b5103c]/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#b5103c]/10">
              <BarChart3 size={32} className="text-[#b5103c]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className={cn(
                "text-3xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Relatórios Inteligentes
              </h1>
              <p className={cn(
                "text-lg",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
              )}>
                Gere relatórios personalizados com IA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn(
              "p-3 rounded-lg border",
              isDarkMode ? "bg-card border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#b5103c]" />
                <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                  Relatórios Gerados
                </span>
              </div>
              <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
                34
              </p>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg border",
              isDarkMode ? "bg-card border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <PieChart size={16} className="text-[#b5103c]" />
                <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                  Análises Ativas
                </span>
              </div>
              <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
                12
              </p>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg border",
              isDarkMode ? "bg-card border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#b5103c]" />
                <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                  Dados Processados
                </span>
              </div>
              <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
                2.4k
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gerador de Relatórios - Reduzido */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode ? "bg-card border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
                  )}>
                    <BarChart3 size={18} className="text-[#b5103c]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className={cn(
                      "text-lg",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      Gerador de Relatórios
                    </CardTitle>
                    <CardDescription className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                    )}>
                      Descreva o relatório que deseja
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Relatório de conversas dos últimos 30 dias..."
                    className={cn(
                      "min-h-[100px] text-sm",
                      isDarkMode 
                        ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" 
                        : "bg-white border-gray-300"
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={generateReport}
                    disabled={loading || !prompt.trim()}
                    size="sm"
                    className="flex-1 bg-[#b5103c] hover:bg-[#9d0e34] text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar Relatório'
                    )}
                  </Button>
                  
                  {generatedReport && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearReport}
                      className={cn(
                        isDarkMode ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""
                      )}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Relatório Gerado - Reduzido */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode ? "bg-card border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
                    )}>
                      <FileText size={18} className="text-[#b5103c]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <CardTitle className={cn(
                        "text-lg",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>
                        Relatório Gerado
                      </CardTitle>
                    </div>
                  </div>
                  {generatedReport && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={printReport}
                        className={cn(
                          isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : ""
                        )}
                      >
                        <Printer size={14} className="mr-2" strokeWidth={1.5} />
                        Imprimir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadReport}
                        className={cn(
                          isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : ""
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
                {generatedReport ? (
                  <div className={cn(
                    "p-3 rounded-lg border min-h-[200px] max-h-[400px] overflow-auto whitespace-pre-wrap text-sm",
                    isDarkMode 
                      ? "bg-zinc-800 border-zinc-700 text-gray-200" 
                      : "bg-gray-50 border-gray-200 text-gray-800"
                  )}>
                    {generatedReport}
                  </div>
                ) : (
                  <div className={cn(
                    "flex items-center justify-center h-[200px] border-2 border-dashed rounded-lg",
                    isDarkMode ? "border-zinc-700" : "border-gray-300"
                  )}>
                    <div className="text-center">
                      <FileText size={32} className={cn(
                        "mx-auto mb-2",
                        isDarkMode ? "text-zinc-600" : "text-gray-400"
                      )} />
                      <p className={cn(
                        "text-sm",
                        isDarkMode ? "text-zinc-500" : "text-gray-500"
                      )}>
                        O relatório aparecerá aqui
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Exemplos de Relatórios - Reduzido */}
          <Card className={cn(
            "border shadow-sm",
            isDarkMode ? "bg-card border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
                )}>
                  <FileText size={18} className="text-[#b5103c]" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className={cn(
                    "text-lg",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    Exemplos de Relatórios
                  </CardTitle>
                  <CardDescription className={cn(
                    "text-sm",
                    isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                  )}>
                    Clique para usar como modelo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  "Relatório de atendimentos por canal",
                  "Análise de satisfação do cliente",
                  "Produtividade da equipe",
                  "Estatísticas de exames agendados",
                  "Tags mais utilizadas",
                  "Tempo de resposta por canal"
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-auto p-2 text-left whitespace-normal text-xs",
                      isDarkMode 
                        ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" 
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

