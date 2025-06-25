
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  RotateCcw,
  Plus,
  QrCode,
  Trash2,
} from 'lucide-react';
import { EvolutionApiService } from '@/services/EvolutionApiService';

interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
}

interface InstanceInfo {
  id: string;
  instanceName: string;
  status?: string;
  profileName?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'unknown';
}

interface QrCodeModal {
  isOpen: boolean;
  qrCode: string;
  instanceName: string;
  loading: boolean;
}

interface InstanceManagerProps {
  isDarkMode?: boolean;
}

export const InstanceManager: React.FC<InstanceManagerProps> = ({
  isDarkMode = false
}) => {
  const { toast } = useToast();

  const [apiConnection, setApiConnection] = useState<ApiConnection>({
    baseUrl: '',
    apiKey: '',
    isValidated: false
  });

  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [validatingApi, setValidatingApi] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [deletingInstance, setDeletingInstance] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState<string | null>(null);
  
  const [qrCodeModal, setQrCodeModal] = useState<QrCodeModal>({
    isOpen: false,
    qrCode: '',
    instanceName: '',
    loading: false
  });

  const validateApiConnection = async () => {
    if (!apiConnection.baseUrl || !apiConnection.apiKey) {
      toast({
        title: "Erro",
        description: "Por favor, preencha URL e API Key",
        variant: "destructive"
      });
      return;
    }

    setValidatingApi(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: ''
      });

      const result = await service.validateConnection();
      
      if (result.success) {
        setApiConnection(prev => ({ ...prev, isValidated: true }));
        toast({
          title: "Conexão validada",
          description: "API Evolution conectada com sucesso"
        });
        await loadInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: `${error}`,
        variant: "destructive"
      });
    } finally {
      setValidatingApi(false);
    }
  };

  const loadInstances = async () => {
    if (!apiConnection.isValidated) return;

    setLoadingInstances(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: ''
      });

      const result = await service.listInstances();
      
      if (result.success && result.instances) {
        const instancesWithStatus = await Promise.all(result.instances.map(async (instance: any) => {
          const statusResult = await service.getConnectionStatus(instance.instanceName);
          return {
            id: instance.instanceName,
            instanceName: instance.instanceName,
            profileName: instance.profileName,
            status: instance.status,
            connectionStatus: (statusResult.connected ? 'connected' : 'disconnected') as 'connected' | 'disconnected' | 'connecting' | 'unknown'
          };
        }));
        setInstances(instancesWithStatus);
      }
    } catch (error) {
      console.error('Error loading instances:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar instâncias",
        variant: "destructive"
      });
    } finally {
      setLoadingInstances(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a instância",
        variant: "destructive"
      });
      return;
    }

    setCreatingInstance(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: newInstanceName
      });

      const result = await service.createInstanceSimple(newInstanceName);
      
      if (result.success) {
        setNewInstanceName('');
        toast({
          title: "Instância criada",
          description: `Instância ${newInstanceName} criada com sucesso`
        });
        await loadInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao criar instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setCreatingInstance(false);
    }
  };

  const generateQRCode = async (instanceName: string) => {
    setLoadingQR(instanceName);
    setQrCodeModal({
      isOpen: true,
      qrCode: "",
      instanceName,
      loading: true,
    });

    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName,
      });

      const result = await service.getQRCodeForInstance(instanceName);

      if (result.success && result.qrCode) {
        setQrCodeModal((prev) => ({
          ...prev,
          qrCode: result.qrCode,
          loading: false,
        }));
      } else {
        throw new Error(result.error || "QR Code não disponível");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Erro",
        description: `Erro ao gerar QR Code: ${error}`,
        variant: "destructive",
      });
      setQrCodeModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setLoadingQR(null);
    }
  };

  const deleteInstance = async (instanceName: string) => {
    setDeletingInstance(instanceName);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: instanceName
      });

      const result = await service.deleteInstance(instanceName);

      if (result.success) {
        toast({
          title: "Instância excluída",
          description: `Instância ${instanceName} excluída com sucesso`
        });
        await loadInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error deleting instance:", error);
      toast({
        title: "Erro",
        description: `Erro ao excluir instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setDeletingInstance(null);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'connected':
        return 'text-green-600';
      case 'close':
      case 'closed':
      case 'disconnected':
        return 'text-red-600';
      case 'connecting':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'connected':
        return 'Conectado';
      case 'close':
      case 'closed':
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando';
      default:
        return 'Desconhecido';
    }
  };

  useEffect(() => {
    if (apiConnection.isValidated) {
      loadInstances();
    }
  }, [apiConnection.isValidated]);

  return (
    <div className={cn("space-y-6", isDarkMode ? "text-white" : "text-gray-900")}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Gerenciador de Instâncias</h2>
        <p className="text-gray-500">
          Gerencie suas instâncias da API Evolution
        </p>
      </div>

      <Card className={isDarkMode ? "bg-[#18181b] border-[#27272a]" : ""}>
        <CardHeader>
          <CardTitle>Conexão com API</CardTitle>
          <CardDescription>
            Configure a URL base e API Key para conectar com a API Evolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-url">URL Base da API</Label>
            <Input
              id="base-url"
              placeholder="https://evolution.estudioonmp.com"
              value={apiConnection.baseUrl}
              onChange={(e) => setApiConnection(prev => ({ ...prev, baseUrl: e.target.value, isValidated: false }))}
              className={isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Sua API Key"
              value={apiConnection.apiKey}
              onChange={(e) => setApiConnection(prev => ({ ...prev, apiKey: e.target.value, isValidated: false }))}
              className={isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""}
            />
          </div>

          <Button
            onClick={validateApiConnection}
            disabled={validatingApi || !apiConnection.baseUrl || !apiConnection.apiKey}
            className="flex items-center gap-2"
          >
            {validatingApi ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : null}
            {validatingApi ? 'Validando...' : 'Validar Conexão'}
          </Button>
        </CardContent>
      </Card>

      {apiConnection.isValidated && (
        <Card className={isDarkMode ? "bg-[#18181b] border-[#27272a]" : ""}>
          <CardHeader>
            <CardTitle>Criar Instância</CardTitle>
            <CardDescription>
              Crie uma nova instância WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova instância"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className={isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""}
              />
              <Button
                onClick={createInstance}
                disabled={creatingInstance || !newInstanceName.trim()}
              >
                {creatingInstance ? (
                  <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {instances.length > 0 && (
        <Card className={isDarkMode ? "bg-[#18181b] border-[#27272a]" : ""}>
          <CardHeader>
            <CardTitle>Instâncias WhatsApp</CardTitle>
            <CardDescription>
              Gerencie suas instâncias do WhatsApp
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {instances.map((instance) => (
                <div
                  key={instance.instanceName}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{instance.instanceName}</p>
                      {instance.profileName && (
                        <p className="text-sm text-gray-500">{instance.profileName}</p>
                      )}
                    </div>
                    <div className={cn("text-sm font-medium", getStatusColor(instance.connectionStatus))}>
                      {getStatusLabel(instance.connectionStatus)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => generateQRCode(instance.instanceName)}
                      variant="outline"
                      size="sm"
                      disabled={loadingQR === instance.instanceName}
                    >
                      {loadingQR === instance.instanceName ? (
                        <RotateCcw className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-1" />
                      )}
                      QR Code
                    </Button>

                    <Button
                      onClick={() => deleteInstance(instance.instanceName)}
                      variant="outline"
                      size="sm"
                      disabled={deletingInstance === instance.instanceName}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingInstance === instance.instanceName ? (
                        <RotateCcw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrCodeModal.isOpen} onOpenChange={(open) => setQrCodeModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Conectar WhatsApp - {qrCodeModal.instanceName}
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar a instância
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            {qrCodeModal.loading ? (
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Gerando QR Code...</span>
              </div>
            ) : qrCodeModal.qrCode ? (
              <>
                <img 
                  src={qrCodeModal.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 border border-gray-300 rounded-lg"
                />
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">Escaneie com seu WhatsApp</p>
                  <p className="text-xs text-gray-500">Instância: {qrCodeModal.instanceName}</p>
                  <p className="text-xs text-gray-400">QR Code expira em alguns minutos</p>
                </div>
              </>
            ) : (
              <p className="text-red-500">Erro ao carregar QR Code</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
