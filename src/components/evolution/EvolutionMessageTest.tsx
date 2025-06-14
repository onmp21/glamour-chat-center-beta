import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Settings,
  Link,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { EvolutionMessageService } from '@/services/EvolutionMessageService'; 
import { useToast } from '@/hooks/use-toast';

interface EvolutionMessageTestProps {
  isDarkMode: boolean;
}

interface TestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export const EvolutionMessageTest: React.FC<EvolutionMessageTestProps> = ({ isDarkMode }) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    instanceName?: string;
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();

  // Canais disponíveis (pode ser carregado dinamicamente)
  const channels = [
    { id: 'canarana', name: 'Canarana' },
    { id: 'souto-soares', name: 'Souto Soares' },
    { id: 'joao-dourado', name: 'João Dourado' },
    { id: 'america-dourada', name: 'América Dourada' },
    { id: 'gerente-lojas', name: 'Gerente Lojas' },
    { id: 'gerente-externo', name: 'Gerente Externo' }
  ];

  const handleSendTestMessage = async () => {
    if (!selectedChannel || !phoneNumber || !message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de enviar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🧪 [EVOLUTION_TEST] Enviando mensagem de teste');

      // Use the corrected service name
      const result = await EvolutionMessageService.sendTextMessage({
        channelId: selectedChannel,
        phoneNumber: phoneNumber,
        message: message
      });

      const testResult: TestResult = {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);

      if (result.success) {
        toast({
          title: "Mensagem enviada!",
          description: `Mensagem enviada com sucesso. ID: ${result.messageId}`,
        });
        setMessage(''); // Limpar campo após envio bem-sucedido
      } else {
        toast({
          title: "Erro ao enviar",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [EVOLUTION_TEST] Erro no teste:', error);
      
      const testResult: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);

      toast({
        title: "Erro no teste",
        description: "Erro inesperado durante o teste",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    if (!selectedChannel) {
      toast({
        title: "Selecione um canal",
        description: "Escolha um canal para verificar a conexão",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 [EVOLUTION_TEST] Verificando conexão');

      // Use the corrected service name
      const status = await EvolutionMessageService.checkChannelConnectionStatus(selectedChannel);
      
      setConnectionStatus({
        connected: status.connected,
        instanceName: status.instanceName,
        error: status.error
      });

      if (status.success) {
        toast({
          title: status.connected ? "Conectado" : "Desconectado",
          description: `Instância: ${status.instanceName}`,
          variant: status.connected ? "default" : "destructive"
        });
      } else {
        toast({
          title: "Erro na verificação",
          description: status.error || "Erro desconhecido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [EVOLUTION_TEST] Erro ao verificar conexão:', error);
      
      toast({
        title: "Erro na verificação",
        description: "Erro inesperado ao verificar conexão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className={cn("p-6 space-y-6", isDarkMode ? "bg-[#212121]" : "bg-gray-50")}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-full", isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10")}>
          <MessageSquare size={32} className="text-[#b5103c]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
            Teste Evolution API
          </h1>
          <p className={cn("text-lg", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
            Teste o envio de mensagens via Evolution API
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Teste */}
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
              <Send size={20} className="text-[#b5103c]" />
              Enviar Mensagem de Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de Canal */}
            <div>
              <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Canal
              </label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número de Telefone */}
            <div>
              <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Número de Telefone
              </label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5511999999999"
                className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
              />
              <p className={cn("text-xs mt-1", isDarkMode ? "text-[#71717a]" : "text-gray-500")}>
                Formato: código do país + DDD + número (sem espaços ou símbolos)
              </p>
            </div>

            {/* Mensagem */}
            <div>
              <label className={cn("text-sm font-medium", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem de teste..."
                rows={3}
                className={cn(
                  "w-full px-3 py-2 border rounded-md resize-none",
                  isDarkMode 
                    ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-500" 
                    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
                )}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                onClick={handleSendTestMessage}
                disabled={isLoading || !selectedChannel || !phoneNumber || !message}
                className="flex-1 bg-[#b5103c] hover:bg-[#9d0e34] text-white"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                Enviar Teste
              </Button>

              <Button
                onClick={handleCheckConnection}
                disabled={isLoading || !selectedChannel}
                variant="outline"
                className={cn(isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#27272a]" : "border-gray-300")}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </Button>
            </div>

            {/* Status de Conexão */}
            {connectionStatus && (
              <div className={cn(
                "p-3 rounded-lg border",
                connectionStatus.connected
                  ? isDarkMode ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"
                  : isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2">
                  {connectionStatus.connected ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    connectionStatus.connected ? "text-green-700" : "text-red-700"
                  )}>
                    {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                {connectionStatus.instanceName && (
                  <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    Instância: {connectionStatus.instanceName}
                  </p>
                )}
                {connectionStatus.error && (
                  <p className="text-xs mt-1 text-red-600">
                    Erro: {connectionStatus.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados dos Testes */}
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
              <Settings size={20} className="text-[#b5103c]" />
              Resultados dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className={cn("text-center py-8", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum teste realizado ainda</p>
                <p className="text-sm">Envie uma mensagem de teste para ver os resultados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
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
                            {result.success ? 'Sucesso' : 'Erro'}
                          </p>
                          <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                            {formatTimestamp(result.timestamp)}
                          </p>
                        </div>
                      </div>
                      {result.success && (
                        <Badge variant="outline" className="text-xs">
                          ID: {result.messageId?.slice(-8)}
                        </Badge>
                      )}
                    </div>
                    {result.error && (
                      <p className="text-xs mt-2 text-red-600">
                        {result.error}
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
