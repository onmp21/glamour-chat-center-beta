
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X, FileText, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportGeneratorModalProps {
  onClose: () => void;
  isAIEnabled: boolean;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  onClose,
  isAIEnabled
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Digite um título para o relatório",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: {
            title: title.trim(),
            description: description.trim(),
            date: new Date().toISOString()
          },
          reportType: 'custom',
          aiPrompt: `Gere um relatório sobre "${title}". ${description ? `Descrição: ${description}` : ''}`
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      const data = await response.json();
      setGeneratedReport(data.report);

      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Verifique a configuração da IA.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReport) return;

    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gerar Novo Relatório</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!generatedReport ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#b5103c]" />
              Configuração do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Relatório</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Análise de Conversas - Janeiro 2024"
                disabled={!isAIEnabled}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que você gostaria de analisar no relatório..."
                disabled={!isAIEnabled}
                rows={3}
              />
            </div>

            {!isAIEnabled && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  Configure a API key do OpenAI nas configurações para gerar relatórios com IA.
                </p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!isAIEnabled || isGenerating || !title.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando relatório...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{title}</h3>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap text-sm">
                {generatedReport}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => setGeneratedReport('')}>
            Gerar Novo Relatório
          </Button>
        </div>
      )}
    </div>
  );
};
