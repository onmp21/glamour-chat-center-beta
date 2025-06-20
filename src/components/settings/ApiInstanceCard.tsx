
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, QrCode, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiInstance {
  id: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at: string;
  connection_status?: 'connected' | 'disconnected' | 'connecting';
  qr_code?: string;
}

interface ApiInstanceCardProps {
  instance: ApiInstance;
  checkingStatus: string | null;
  isDarkMode?: boolean;
  onCheckConnectionStatus: (instance: ApiInstance) => void;
  onShowQRCode: (instanceId: string) => void;
  onDelete: (instance: ApiInstance) => void;
}

export const ApiInstanceCard: React.FC<ApiInstanceCardProps> = ({
  instance,
  checkingStatus,
  isDarkMode = false,
  onCheckConnectionStatus,
  onShowQRCode,
  onDelete
}) => {
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
              <Badge variant={instance.connection_status === 'connected' ? 'default' : 'destructive'}>
                {instance.connection_status === 'connected' ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : (
                  <WifiOff className="h-3 w-3 mr-1" />
                )}
                {instance.connection_status === 'connected' ? 'Conectado' : instance.connection_status === 'connecting' ? 'Conectando' : 'Desconectado'}
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
