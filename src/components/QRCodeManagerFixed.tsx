import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { QrCode, Wifi, WifiOff, Settings as SettingsIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';
import { EvolutionApiSettings } from '@/components/EvolutionApiSettings';
import { MediaProcessorUnified } from '@/utils/MediaProcessorUnified';

interface QRCodeManagerFixedProps {
  isDarkMode: boolean;
  channelId: string;
}

export const QRCodeManagerFixed: React.FC<QRCodeManagerFixedProps> = ({
  isDarkMode,
  channelId
}) => {
  const { generateQRCode, checkConnectionStatus } = useEvolutionApiSender();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'qr'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkConnectionStatus(channelId);
        setConnectionStatus(status.state as any);
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setConnectionStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [channelId, checkConnectionStatus]);

  const handleGenerateQRCode = async () => {
    setLoading(true);
    setQrError(null);
    
    try {
      console.log('🔍 [QR_MANAGER_FIXED] Generating QR Code for channel:', channelId);
      
      const result = await generateQRCode(channelId);
      
      if (result.success) {
        // Check if connected property exists
        if ('connected' in result && result.connected) {
          setConnectionStatus('connected');
          toast({
            title: "Já Conectado",
            description: "WhatsApp já está conectado e webhook configurado",
          });
        } else if (result.qrCode) {
          console.log('🔍 [QR_MANAGER_FIXED] Processing QR Code data');
          
          // Usar o processador unificado para QR Code
          const processedQR = MediaProcessorUnified.processQRCode(result.qrCode);
          
          if (processedQR.success && processedQR.dataUrl) {
            setQrCode(processedQR.dataUrl);
            setShowQrCode(true);
            setConnectionStatus('qr');
            
            console.log('✅ [QR_MANAGER_FIXED] QR Code processado e exibindo');
            toast({
              title: "QR Code gerado",
              description: "Escaneie o QR Code com seu WhatsApp para conectar",
            });
          } else {
            throw new Error(processedQR.error || 'Erro ao processar QR Code');
          }
        } else {
          throw new Error('QR Code não foi retornado pela API');
        }
      } else {
        // Handle error property safely
        const errorMessage = 'error' in result ? result.error : 'Erro ao gerar QR Code';
        throw new Error(errorMessage || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('❌ [QR_MANAGER_FIXED] Erro ao gerar QR Code:', error);
      setQrError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast({
        title: "Erro",
        description: `Erro ao gerar QR Code: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return 'bg-green-500';
      case 'connecting':
      case 'qr':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'close':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'qr':
        return 'Aguardando QR';
      case 'disconnected':
      case 'close':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return <Wifi size={20} className="text-green-500" />;
      case 'connecting':
      case 'qr':
        return <QrCode size={20} className="text-yellow-500" />;
      case 'disconnected':
      case 'close':
        return <WifiOff size={20} className="text-red-500" />;
      default:
        return <WifiOff size={20} className="text-gray-500" />;
    }
  };

  if (showSettings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Configurações da Evolution API</h3>
          <Button variant="outline" onClick={() => setShowSettings(false)}>
            Voltar
          </Button>
        </div>
        <EvolutionApiSettings 
          isDarkMode={isDarkMode}
          channelId={channelId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status da Conexão */}
      <Card className={cn(
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(connectionStatus)}
            Status da Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Status atual da conexão com o WhatsApp via Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                getStatusColor(connectionStatus)
              )} />
              <div>
                <p className="font-medium">{getStatusText(connectionStatus)}</p>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Canal: {channelId}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {getStatusText(connectionStatus)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkConnectionStatus(channelId)}
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erro do QR Code */}
      {qrError && (
        <Card className={cn(
          "border-red-200",
          isDarkMode ? "bg-red-900/20 border-red-800" : "bg-red-50"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  Erro no QR Code
                </p>
                <p className="text-sm text-red-500 dark:text-red-300">
                  {qrError}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gerar QR Code */}
        <Card className={cn(
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode size={20} />
              Conectar WhatsApp
            </CardTitle>
            <CardDescription>
              {connectionStatus === 'connected' 
                ? 'WhatsApp já está conectado' 
                : 'Gere um QR Code para conectar seu WhatsApp'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateQRCode}
              disabled={loading}
              className="w-full"
              variant={connectionStatus === 'connected' ? 'outline' : 'default'}
            >
              {loading ? 'Gerando...' : 
               connectionStatus === 'connected' ? 'Verificar Conexão' : 'Gerar QR Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card className={cn(
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon size={20} />
              Configurações
            </CardTitle>
            <CardDescription>
              Configure instâncias e parâmetros da API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              className="w-full"
            >
              Abrir Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal do QR Code */}
      {showQrCode && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className={cn(
            "w-96 max-w-[90vw]",
            isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <CardHeader>
              <CardTitle>QR Code do WhatsApp</CardTitle>
              <CardDescription>
                Escaneie este código com seu WhatsApp para conectar
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 border rounded object-contain"
                  onError={(e) => {
                    console.error('❌ [QR_DISPLAY] Erro ao carregar QR Code:', e);
                    setQrError('Erro ao exibir QR Code');
                    setShowQrCode(false);
                  }}
                  onLoad={() => {
                    console.log('✅ [QR_DISPLAY] QR Code carregado com sucesso');
                  }}
                />
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em Menu ou Configurações</p>
                <p>3. Toque em Aparelhos conectados</p>
                <p>4. Escaneie este código QR</p>
              </div>
              
              <Button onClick={() => setShowQrCode(false)}>
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
