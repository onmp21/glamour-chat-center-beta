
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Activity, Settings } from 'lucide-react';
import { channelWebSocketManager } from '@/services/ChannelWebSocketManager';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';

interface WebSocketManagerProps {
  isDarkMode: boolean;
  channelId: string;
  instanceName?: string;
}

export const WebSocketManager: React.FC<WebSocketManagerProps> = ({
  isDarkMode,
  channelId,
  instanceName
}) => {
  const { toast } = useToast();
  const { initializeWebSocketForChannel, checkConnectionStatus } = useEvolutionApiSender();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWebSocketStatus();
    
    // Verificar status periodicamente
    const interval = setInterval(checkWebSocketStatus, 10000);
    
    return () => clearInterval(interval);
  }, [channelId]);

  const checkWebSocketStatus = async () => {
    try {
      const isChannelConnected = channelWebSocketManager.isChannelConnected(channelId);
      const status = channelWebSocketManager.getConnectionStatus(channelId);
      
      setIsConnected(isChannelConnected);
      setConnectionStatus(status);
      
      console.log(`📡 [WEBSOCKET_MANAGER] Status do canal ${channelId}:`, { isChannelConnected, status });
    } catch (error) {
      console.error('❌ [WEBSOCKET_MANAGER] Erro ao verificar status:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      console.log(`🔄 [WEBSOCKET_MANAGER] Iniciando conexão WebSocket para canal: ${channelId}`);
      
      const result = await initializeWebSocketForChannel(channelId);
      
      if (result.success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        
        toast({
          title: "WebSocket Conectado",
          description: "Canal configurado para receber mensagens em tempo real",
        });
      } else {
        throw new Error(result.error || 'Falha ao conectar WebSocket');
      }
    } catch (error) {
      console.error('❌ [WEBSOCKET_MANAGER] Erro ao conectar:', error);
      
      toast({
        title: "Erro na Conexão",
        description: `Falha ao conectar WebSocket: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      console.log(`🔄 [WEBSOCKET_MANAGER] Desconectando WebSocket para canal: ${channelId}`);
      
      const result = await channelWebSocketManager.disconnectChannelWebSocket(channelId);
      
      if (result.success) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        toast({
          title: "WebSocket Desconectado",
          description: "Conexão WebSocket encerrada",
        });
      } else {
        throw new Error(result.error || 'Falha ao desconectar WebSocket');
      }
    } catch (error) {
      console.error('❌ [WEBSOCKET_MANAGER] Erro ao desconectar:', error);
      
      toast({
        title: "Erro",
        description: `Falha ao desconectar WebSocket: ${error}`,
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
        return 'bg-yellow-500';
      case 'disconnected':
      case 'closed':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-700';
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
      case 'disconnected':
      case 'closed':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return <Wifi size={16} className="text-green-500" />;
      case 'connecting':
        return <Activity size={16} className="text-yellow-500 animate-pulse" />;
      case 'disconnected':
      case 'closed':
        return <WifiOff size={16} className="text-red-500" />;
      case 'error':
        return <WifiOff size={16} className="text-red-700" />;
      default:
        return <Settings size={16} className="text-gray-500" />;
    }
  };

  return (
    <Card className={cn(
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(connectionStatus)}
          WebSocket Connection
        </CardTitle>
        <CardDescription>
          Gerenciar conexão WebSocket para recebimento de mensagens em tempo real
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              getStatusColor(connectionStatus)
            )} />
            <span className="font-medium">Status:</span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {getStatusText(connectionStatus)}
            </Badge>
          </div>
        </div>

        {/* Informações da Conexão */}
        {instanceName && (
          <div className={cn(
            "p-3 rounded border",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
          )}>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Canal:</span>
                <span className="font-mono">{channelId}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Instância:</span>
                <span className="font-mono">{instanceName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Wifi size={16} className="mr-2" />
              {loading ? 'Conectando...' : 'Conectar WebSocket'}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <WifiOff size={16} className="mr-2" />
              {loading ? 'Desconectando...' : 'Desconectar'}
            </Button>
          )}
          
          <Button
            onClick={checkWebSocketStatus}
            variant="outline"
            size="sm"
          >
            <Activity size={16} />
          </Button>
        </div>

        {/* Mensagem de Ajuda */}
        {!isConnected && (
          <div className={cn(
            "p-3 rounded text-sm",
            isDarkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"
          )}>
            💡 Conecte o WebSocket para receber mensagens do WhatsApp automaticamente neste canal.
          </div>
        )}

        {isConnected && (
          <div className={cn(
            "p-3 rounded text-sm",
            isDarkMode ? "bg-green-900/20 text-green-300" : "bg-green-50 text-green-700"
          )}>
            ✅ WebSocket ativo! Mensagens serão recebidas automaticamente.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
