import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { base64ToHtmlService } from '@/services/Base64ToHtmlService';
import { useToast } from '@/hooks/use-toast';

interface Base64ToHtmlTestProps {
  isDarkMode: boolean;
}

interface ConversionResult {
  success: boolean;
  htmlUrl?: string;
  error?: string;
  timestamp: string;
  fileName: string;
}

export const Base64ToHtmlTest: React.FC<Base64ToHtmlTestProps> = ({ isDarkMode }) => {
  const [base64Input, setBase64Input] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [channelId, setChannelId] = useState<string>('test-channel');
  const [sessionId, setSessionId] = useState<string>('test-session');
  const [isLoading, setIsLoading] = useState(false);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setBase64Input(result);
        setFileName(file.name);
        toast({
          title: "Arquivo carregado",
          description: `${file.name} foi convertido para Base64`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConvertBase64 = async () => {
    if (!base64Input.trim()) {
      toast({
        title: "Base64 obrigatório",
        description: "Insira dados Base64 ou carregue um arquivo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🧪 [BASE64_TEST] Iniciando conversão de teste');

      const result = await base64ToHtmlService.convertBase64ToHtml(base64Input, {
        fileName: fileName || 'test-file',
        channelId: channelId,
        sessionId: sessionId,
        messageId: `test-${Date.now()}`
      });

      const conversionResult: ConversionResult = {
        success: result.success,
        htmlUrl: result.htmlUrl,
        error: result.error,
        timestamp: new Date().toISOString(),
        fileName: fileName || 'test-file'
      };

      setConversionResults(prev => [conversionResult, ...prev]);

      if (result.success) {
        toast({
          title: "Conversão realizada!",
          description: "Base64 convertido para HTML com sucesso",
        });
      } else {
        toast({
          title: "Erro na conversão",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [BASE64_TEST] Erro no teste:', error);
      
      const conversionResult: ConversionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        fileName: fileName || 'test-file'
      };

      setConversionResults(prev => [conversionResult, ...prev]);

      toast({
        title: "Erro no teste",
        description: "Erro inesperado durante a conversão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupOldFiles = async () => {
    setIsCleaningUp(true);

    try {
      console.log('🧹 [BASE64_TEST] Iniciando limpeza de arquivos antigos');

      const result = await base64ToHtmlService.cleanupOldHtmlFiles(7); // 7 dias

      if (result.success) {
        toast({
          title: "Limpeza concluída",
          description: `${result.deletedCount} arquivos antigos removidos`,
        });
      } else {
        toast({
          title: "Erro na limpeza",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [BASE64_TEST] Erro na limpeza:', error);
      toast({
        title: "Erro na limpeza",
        description: "Erro inesperado durante a limpeza",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleEnsureBucket = async () => {
    setIsLoading(true);

    try {
      console.log('🔍 [BASE64_TEST] Verificando bucket de storage');

      const result = await base64ToHtmlService.ensureStorageBucketExists();

      if (result.success) {
        toast({
          title: "Bucket verificado",
          description: "Bucket de storage está disponível",
        });
      } else {
        toast({
          title: "Erro no bucket",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [BASE64_TEST] Erro na verificação:', error);
      toast({
        title: "Erro na verificação",
        description: "Erro inesperado durante a verificação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const generateSampleBase64 = () => {
    // Gerar uma imagem SVG simples como exemplo
    const svgContent = `
      <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="100" fill="#b5103c"/>
        <text x="100" y="55" font-family="Arial" font-size="16" fill="white" text-anchor="middle">
          Teste Base64
        </text>
      </svg>
    `;
    
    const base64 = btoa(svgContent);
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    
    setBase64Input(dataUrl);
    setFileName('teste-imagem.svg');
    
    toast({
      title: "Exemplo carregado",
      description: "Base64 de exemplo foi inserido",
    });
  };

  return (
    <div className={cn("p-6 space-y-6", isDarkMode ? "bg-[#212121]" : "bg-gray-50")}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-full", isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10")}>
          <FileText size={32} className="text-[#b5103c]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
            Teste Base64 para HTML
          </h1>
          <p className={cn("text-lg", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
            Teste a conversão de Base64 para HTML e armazenamento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Teste */}
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
              <Upload size={20} className="text-[#b5103c]" />
              Converter Base64 para HTML
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload de Arquivo */}
            <div>
              <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Carregar Arquivo (Opcional)
              </label>
              <Input
                type="file"
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
                className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
              />
            </div>

            {/* Nome do Arquivo */}
            <div>
              <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Nome do Arquivo
              </label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="exemplo.jpg"
                className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
              />
            </div>

            {/* Canal e Sessão */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                  Canal ID
                </label>
                <Input
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="test-channel"
                  className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
                />
              </div>
              <div>
                <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                  Sessão ID
                </label>
                <Input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="test-session"
                  className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
                />
              </div>
            </div>

            {/* Base64 Input */}
            <div>
              <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Dados Base64
              </label>
              <Textarea
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
                rows={4}
                className={cn(
                  "font-mono text-xs",
                  isDarkMode 
                    ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-500" 
                    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
                )}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleConvertBase64}
                disabled={isLoading || !base64Input.trim()}
                className="flex-1 bg-[#b5103c] hover:bg-[#9d0e34] text-white"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <FileText size={16} className="mr-2" />
                )}
                Converter
              </Button>

              <Button
                onClick={generateSampleBase64}
                disabled={isLoading}
                variant="outline"
                className={cn(isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300")}
              >
                Exemplo
              </Button>

              <Button
                onClick={handleEnsureBucket}
                disabled={isLoading}
                variant="outline"
                className={cn(isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300")}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </Button>

              <Button
                onClick={handleCleanupOldFiles}
                disabled={isCleaningUp}
                variant="outline"
                className={cn(isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300")}
              >
                {isCleaningUp ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados das Conversões */}
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
              <Download size={20} className="text-[#b5103c]" />
              Resultados das Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversionResults.length === 0 ? (
              <div className={cn("text-center py-8", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversão realizada ainda</p>
                <p className="text-sm">Converta um Base64 para ver os resultados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversionResults.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      result.success
                        ? isDarkMode ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"
                        : isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle size={16} className="text-green-500 mt-0.5" />
                        ) : (
                          <XCircle size={16} className="text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            result.success ? "text-green-700" : "text-red-700"
                          )}>
                            {result.fileName}
                          </p>
                          <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                            {formatTimestamp(result.timestamp)}
                          </p>
                        </div>
                      </div>
                      {result.success && result.htmlUrl && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(result.htmlUrl, '_blank')}
                            className="h-8 px-2"
                          >
                            <Eye size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(result.htmlUrl!)}
                            className="h-8 px-2"
                          >
                            📋
                          </Button>
                        </div>
                      )}
                    </div>
                    {result.error && (
                      <p className="text-xs mt-2 text-red-600">
                        {result.error}
                      </p>
                    )}
                    {result.success && result.htmlUrl && (
                      <p className="text-xs mt-2 font-mono break-all">
                        {result.htmlUrl}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

