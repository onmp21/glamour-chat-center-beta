
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, RotateCcw, QrCode, LogOut, Trash2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstanceInfo {
  instanceName: string;
  instanceId: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  status: string;
  serverUrl: string;
  apikey: string;
  number?: string;
}

interface InstanceManagementSectionProps {
  instances: InstanceInfo[];
  newInstanceName: string;
  setNewInstanceName: (name: string) => void;
  creatingInstance: boolean;
  deletingInstance: string | null;
  loggingOutInstance: string | null;
  onCreateInstance: () => void;
  onDeleteInstance: (instanceName: string) => void;
  onLogoutInstance: (instanceName: string) => void;
  onShowQRCode: (instanceName: string) => void;
  isDarkMode: boolean;
}

export const InstanceManagementSection: React.FC<InstanceManagementSectionProps> = ({
  instances,
  newInstanceName,
  setNewInstanceName,
  creatingInstance,
  deletingInstance,
  loggingOutInstance,
  onCreateInstance,
  onDeleteInstance,
  onLogoutInstance,
  onShowQRCode,
  isDarkMode
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { color: 'bg-green-500', text: 'Conectado', icon: Wifi },
      'connected': { color: 'bg-green-500', text: 'Conectado', icon: Wifi },
      'ready': { color: 'bg-green-500', text: 'Conectado', icon: Wifi },
      'online': { color: 'bg-green-500', text: 'Conectado', icon: Wifi },
      'close': { color: 'bg-red-500', text: 'Desconectado', icon: WifiOff },
      'closed': { color: 'bg-red-500', text: 'Desconectado', icon: WifiOff },
      'disconnected': { color: 'bg-red-500', text: 'Desconectado', icon: WifiOff },
      'offline': { color: 'bg-red-500', text: 'Desconectado', icon: WifiOff },
      'connecting': { color: 'bg-yellow-500', text: 'Conectando', icon: Settings },
      'qr': { color: 'bg-blue-500', text: 'QR Code', icon: QrCode }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.close;
    const Icon = config.icon;

    return (
      <Badge className={cn("text-white", config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "border-2",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Gerenciar Instâncias
        </CardTitle>
        <CardDescription>
          Crie novas instâncias ou gerencie as existentes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Criar Nova Instância */}
        <div className="flex space-x-2">
          <Input
            placeholder="Ex: minha-loja-principal"
            value={newInstanceName}
            onChange={(e) => setNewInstanceName(e.target.value)}
            disabled={creatingInstance}
            className={cn(
              "flex-grow",
              isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
            )}
          />
          <Button
            onClick={onCreateInstance}
            disabled={creatingInstance}
            className={cn(
              "bg-blue-600 hover:bg-blue-700 text-white",
              creatingInstance && "bg-gray-400 hover:bg-gray-400"
            )}
          >
            {creatingInstance ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Criar Instância
              </>
            )}
          </Button>
        </div>

        {/* Lista de Instâncias Existentes */}
        <div className="space-y-2">
          <Label>Instâncias Existentes ({instances.length}):</Label>
          {instances.length === 0 ? (
            <p className={cn(
              "text-sm p-4 rounded-lg border border-dashed text-center",
              isDarkMode ? "text-gray-400 border-gray-600" : "text-gray-500 border-gray-300"
            )}>
              Nenhuma instância encontrada na API
            </p>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div
                  key={instance.instanceName}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg",
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getStatusBadge(instance.status)}
                    <div>
                      <span className={cn(
                        "font-semibold text-base",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>
                        {instance.instanceName}
                      </span>
                      {instance.profileName && (
                        <p className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {instance.profileName}
                        </p>
                      )}
                      {instance.number && (
                        <p className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {instance.number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(instance.status === 'connecting' || instance.status === 'close' || instance.status === 'unknown') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShowQRCode(instance.instanceName)}
                        className={cn(
                          isDarkMode ? "border-[#3f3f46] text-white" : "border-gray-300 text-gray-700"
                        )}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                      </Button>
                    )}
                    {instance.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLogoutInstance(instance.instanceName)}
                        disabled={loggingOutInstance === instance.instanceName}
                        className={cn(
                          "border-orange-500 text-orange-600 hover:bg-orange-50",
                          isDarkMode ? "border-orange-400 text-orange-400 hover:bg-orange-900/20" : ""
                        )}
                      >
                        {loggingOutInstance === instance.instanceName ? (
                          <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4" />
                        )}
                        Desconectar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteInstance(instance.instanceName)}
                      disabled={deletingInstance === instance.instanceName}
                      className={cn(
                        "border-red-500 text-red-600 hover:bg-red-50",
                        isDarkMode ? "border-red-400 text-red-400 hover:bg-red-900/20" : ""
                      )}
                    >
                      {deletingInstance === instance.instanceName ? (
                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
