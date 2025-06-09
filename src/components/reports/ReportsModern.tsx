
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FileText, Bot, Settings, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { ReportGeneratorModal } from './ReportGeneratorModal';

interface ReportsModernProps {
  isDarkMode?: boolean;
}

export const ReportsModern: React.FC<ReportsModernProps> = ({ isDarkMode = false }) => {
  const { toast } = useToast();
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);

  // Verificar se a IA está configurada
  useEffect(() => {
    checkAIConfiguration();
  }, []);

  const checkAIConfiguration = async () => {
    try {
      const response = await fetch('/api/test-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      setIsAIConfigured(response.ok);
    } catch (error) {
      setIsAIConfigured(false);
    }
  };

  const handleConfigureAI = () => {
    window.location.hash = '#configuracoes?section=ai';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-lg text-muted-foreground">
            Gere relatórios inteligentes com análise por IA
          </p>
        </div>

        {isAIConfigured ? (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1 text-[#b5103c]" />
            IA Configurada
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1 text-[#b5103c]" />
            IA Não Configurada
          </Badge>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#b5103c]/10">
                <FileText className="h-5 w-5 text-[#b5103c]" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Relatórios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", isAIConfigured ? "bg-green-100" : "bg-red-100")}>
                <Bot className={cn("h-5 w-5 text-[#b5103c]")} />
              </div>
              <div>
                <p className="text-2xl font-bold">{isAIConfigured ? 'Ativa' : 'Inativa'}</p>
                <p className="text-sm text-muted-foreground">IA OpenAI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Sparkles className="h-5 w-5 text-[#b5103c]" />
              </div>
              <div>
                <p className="text-2xl font-bold">GPT-3.5</p>
                <p className="text-sm text-muted-foreground">Modelo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração da IA */}
      {!isAIConfigured && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-[#b5103c] mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-900">IA não configurada</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Para gerar relatórios inteligentes com análise por IA, você precisa configurar a API key do OpenAI.
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-amber-700">
                    <strong>Como configurar:</strong>
                  </p>
                  <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                    <li>Obtenha sua API key no <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">site da OpenAI</a></li>
                    <li>Vá em Configurações → IA</li>
                    <li>Cole sua API key (formato: sk-...)</li>
                    <li>Teste a conexão</li>
                  </ol>
                </div>
                <Button 
                  onClick={handleConfigureAI}
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Settings className="h-4 w-4 mr-2 text-[#b5103c]" />
                  Configurar IA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gerador de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#b5103c]" />
            Gerar Novo Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isAIConfigured 
                ? 'Gere relatórios personalizados com análise por IA.' 
                : 'Configure a IA para gerar relatórios com análise inteligente.'
              }
            </p>
            
            <Button 
              onClick={() => setShowReportGenerator(true)}
              disabled={!isAIConfigured}
              className="bg-[#b5103c] hover:bg-[#b5103c]/90"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recursos de IA */}
      {isAIConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Recursos de IA Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Bot className="h-5 w-5 text-[#b5103c] mt-1" />
                <div>
                  <h4 className="font-medium">Análise de Sentimentos</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifica padrões emocionais nas conversas com clientes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Sparkles className="h-5 w-5 text-[#b5103c] mt-1" />
                <div>
                  <h4 className="font-medium">Insights Automáticos</h4>
                  <p className="text-sm text-muted-foreground">
                    Gera recomendações baseadas nos dados de conversas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <FileText className="h-5 w-5 text-[#b5103c] mt-1" />
                <div>
                  <h4 className="font-medium">Relatórios Estruturados</h4>
                  <p className="text-sm text-muted-foreground">
                    Organiza informações em formato profissional e legível
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Settings className="h-5 w-5 text-[#b5103c] mt-1" />
                <div>
                  <h4 className="font-medium">Personalização</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajuste prompts e parâmetros para suas necessidades
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal do Gerador de Relatórios */}
      {showReportGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <ReportGeneratorModal 
              onClose={() => setShowReportGenerator(false)}
              isAIEnabled={isAIConfigured}
            />
          </div>
        </div>
      )}
    </div>
  );
};
