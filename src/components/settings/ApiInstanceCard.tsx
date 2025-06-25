
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, QrCode, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiInstanceWithConnection } from '@/types/domain/api/ApiInstance';

interface ApiInstanceCardProps {
  instance: ApiInstanceWithConnection;
  checkingStatus: string | null;
  isDarkMode?: boolean;
  onCheckConnectionStatus: (instance: ApiInstanceWithConnection) => void;
  onShowQRCode: (instanceId: string) => void;
  onDelete: (instance: ApiInstanceWithConnection) => void;
}

export const ApiInstanceCard: React.FC<ApiInstanceCardProps> = ({
  instance,
  checkingStatus,
  isDarkMode = false,
  onCheckConnectionStatus,
  onShowQRCode,
  onDelete
}) => {
  const getConnectionStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'disconnected': return 'Desconectado';
      case 'unknown': return 'Desconhecido';
      default: return 'Desconhecido';
    }
  };

  const getConnectionIcon = (status: string | undefined) => {
    if (status === 'connected') {
      return <Wifi className="h-3 w-3 mr-1" />;
    }
    return <WifiOff className="h-3 w-3 mr-1" />;
  };

  const getConnectionVariant = (status: string | undefined) => {
    return status === 'connected' ? 'default' : 'destructive';
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isDarkMode ? "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]" : "bg-white border-gray-200 hover:border-gray-300"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-base", isDarkMode ? "text-white" : "text-gray-900")}>
            {instance.instance_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {instance.connection_status && (
              <Badge variant={getConnectionVariant(instance.connection_status)}>
                {getConnectionIcon(instance.connection_status)}
                {getConnectionStatusLabel(instance.connection_status)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {instance.qr_code && (
          <div className="flex justify-center items-center p-4 bg-white rounded-md">
            <img src={`data:image/png;base64,${instance.qr_code}`} alt="QR Code" className="w-32 h-32" />
          </div>
        )}
        <div className="space-y-2">
          <div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
              URL Base:
            </span>
            <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
              {instance.base_url}
            </p>
          </div>
          <div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
              API Key:
            </span>
            <p className={cn("text-sm font-mono", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
              {instance.api_key.substring(0, 10)}...
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onCheckConnectionStatus(instance)}
            disabled={checkingStatus === instance.id}
            variant="outline"
            size="sm"
            className={cn(
              isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
            )}
          >
            {checkingStatus === instance.id ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wifi className="h-4 w-4 mr-2" />
            )}
            Verificar Status
          </Button>
          

          
          <Button
            onClick={() => onDelete(instance)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
