
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegacyReportGeneratorProps {
  reportType: string;
  reportTitle: string;
  reportData: any[];
  period: {
    start: string;
    end: string;
  };
  isDarkMode: boolean;
}

export const LegacyReportGenerator: React.FC<LegacyReportGeneratorProps> = ({
  reportType,
  reportTitle,
  reportData,
  period,
  isDarkMode
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const content = `# ${reportTitle}

**Período:** ${new Date(period.start).toLocaleDateString()} - ${new Date(period.end).toLocaleDateString()}

**Tipo:** ${reportType}

**Dados Analisados:** ${reportData.length} registros

## Resumo

Este relatório foi gerado automaticamente com base nos dados disponíveis para o período selecionado.

## Detalhes

${reportData.slice(0, 5).map((item, index) => `${index + 1}. ${JSON.stringify(item)}`).join('\n')}

---
*Relatório gerado em ${new Date().toLocaleString()}*
`;
      
      setReportContent(content);
      setIsGenerating(false);
    }, 2000);
  };

  const downloadReport = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={generateReport}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
        </Button>
        {reportContent && (
          <Button
            variant="outline"
            onClick={downloadReport}
          >
            <Download size={16} className="mr-2" />
            Download
          </Button>
        )}
      </div>

      {reportContent && (
        <Card className={cn(isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} />
              {reportTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "p-3 rounded-lg border max-h-[300px] overflow-auto whitespace-pre-wrap text-sm",
              isDarkMode ? "bg-input border-input text-card-foreground" : "bg-gray-50 border-gray-200"
            )}>
              {reportContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
