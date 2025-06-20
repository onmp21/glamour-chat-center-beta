
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, QrCode, ExternalLink, RefreshCw } from 'lucide-react';

interface EvolutionInstanceCardProps {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
    owner?: string;
    profileName?: string;
    profilePictureUrl?: string;
    profileStatus?: string;
    serverUrl: string;
    apikey: string;
    apiInstanceId?: string;
  };
  isDarkMode?: boolean;
  onShowQRCode?: (instanceId: string) => void;
  onRefreshStatus?: (instanceId: string) => void;
}

export const EvolutionInstanceCard: React.FC<EvolutionInstanceCardProps> = ({
  instance,
  isDarkMode = false,
  onShowQRCode,
  onRefreshStatus
}) => {
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'connected':
        return {
          label: 'Conectado',
          color: 'bg-green-500',
          variant: 'default' as const,
          icon: <Wifi className="h-3 w-3" />,
          needsQR: false
        };
      case 'connecting':
        return {
          label: 'Conectando',
          color: 'bg-yellow-500',
          variant: 'secondary' as const,
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          needsQR: true
        };
      case 'close':
      case 'disconnected':
        return {
          label: 'Desconectado',
          color: 'bg-red-500',
          variant: 'destructive' as const,
          icon: <WifiOff className="h-3 w-3" />,
          needsQR: true
        };
      case 'qrcode':
        return {
          label: 'Aguardando QR Code',
          color: 'bg-blue-500',
          variant: 'secondary' as const,
          icon: <QrCode className="h-3 w-3" />,
          needsQR: true
        };
      default:
        return {
          label: 'Status Desconhecido',
          color: 'bg-gray-500',
          variant: 'secondary' as const,
          icon: <WifiOff className="h-3 w-3" />,
          needsQR: false
        };
    }
  };

  const statusInfo = getStatusInfo(instance.status);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isDarkMode ? "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]" : "bg-white border-gray-200 hover:border-gray-300"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={cn("text-base mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
              {instance.instanceName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                {statusInfo.icon}
                {statusInfo.label}
              </Badge>
              {instance.profileStatus && (
                <Badge variant="outline" className="text-xs">
                  {instance.profileStatus}
                </Badge>
              )}
            </div>
          </div>
          
          {instance.profilePictureUrl && (
            <img 
              src={instance.profilePictureUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {instance.profileName && (
          <div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
              Perfil:
            </span>
            <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
              {instance.profileName}
            </p>
          </div>
        )}
        
        <div>
          <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
            ID da Instância:
          </span>
          <p className={cn("text-sm font-mono", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
            {instance.instanceId}
          </p>
        </div>

        <div>
          <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
            Servidor:
          </span>
          <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
            {instance.serverUrl}
          </p>
        </div>

        {instance.owner && (
          <div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
              Proprietário:
            </span>
            <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
              {instance.owner}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {statusInfo.needsQR && onShowQRCode && (
            <Button
              onClick={() => onShowQRCode(instance.instanceId)}
              variant="outline"
              size="sm"
              className={cn(
                "flex-1",
                isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
              )}
            >
              <QrCode className="h-4 w-4 mr-2" />
              {statusInfo.label === 'Aguardando QR Code' ? 'Ver QR Code' : 'Gerar QR Code'}
            </Button>
          )}
          
          {onRefreshStatus && (
            <Button
              onClick={() => onRefreshStatus(instance.instanceId)}
              variant="outline"
              size="sm"
              className={cn(
                statusInfo.needsQR ? "flex-none" : "flex-1",
                isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
              )}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          )}
          
          <Button
            onClick={() => window.open(instance.serverUrl, '_blank')}
            variant="outline"
            size="sm"
            className={cn(
              "flex-none",
              isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
            )}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
