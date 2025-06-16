import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Plus, Wifi, WifiOff, Settings, Trash2, Eye, EyeOff, Copy, QrCode, Webhook } from 'lucide-react';
import { EvolutionApiService, InstanceInfo } from '@/services/EvolutionApiService';
import { N8nMessagingService } from '@/services/N8nMessagingService';
import { DeleteInstanceModal } from '@/components/modals/DeleteInstanceModal';

interface InstanceManagerProps {
  isDarkMode: boolean;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
  };
  onInstanceSelect?: (instanceName: string) => void;
}

export const InstanceManager: React.FC<InstanceManagerProps> = ({
  isDarkMode,
  apiConfig,
  onInstanceSelect
}) => {
  const { toast } = useToast();
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [qrCodeModal, setQrCodeModal] = useState<{ instanceName: string; qrCode: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; instanceName: string }>({ isOpen: false, instanceName: '' });
  const [webhookStatus, setWebhookStatus] = useState<{ [key: string]: boolean }>({});

  const loadInstances = async () => {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      toast({
        title: "Configuração incompleta",
        description: "Configure a URL base e API Key primeiro",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        instanceName: 'temp'
      });

      const result = await service.listInstances();
      
      if (result.success && result.instances) {
        setInstances(result.instances);
        console.log('📋 [INSTANCE_MANAGER] Instâncias carregadas:', result.instances.length);
        
        toast({
          title: "Instâncias carregadas",
          description: `${result.instances.length} instância(s) encontrada(s)`,
        });
      } else {
        throw new Error(result.error || 'Erro ao carregar instâncias');
      }
    } catch (error) {
      console.error('❌ [INSTANCE_MANAGER] Erro:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar instâncias: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateN8nWebhook = async () => {
    try {
      const result = await N8nMessagingService.validateWebhook();
      if (result.success) {
        toast({
          title: "Webhook N8N",
          description: "Webhook N8N está funcionando corretamente",
        });
      } else {
        toast({
          title: "Erro no Webhook N8N",
          description: result.error || "Webhook N8N não está acessível",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao validar webhook N8N",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (apiConfig.baseUrl && apiConfig.apiKey) {
      loadInstances();
    }
  }, [apiConfig.baseUrl, apiConfig.apiKey]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'open':
        return 'bg-green-500';
      case 'connecting':
      case 'qr':
        return 'bg-yellow-500';
      case 'close':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'qr':
        return 'QR Code';
      case 'close':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  const handleInstanceSelect = (instanceName: string) => {
    setSelectedInstance(instanceName);
    onInstanceSelect?.(instanceName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    });
  };

  const generateQRCode = async (instanceName: string) => {
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        instanceName
      });

      const result = await service.getQRCodeForInstance();
      
      if (result.success && result.qrCode) {
        setQrCodeModal({ instanceName, qrCode: result.qrCode });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao gerar QR Code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar QR Code",
        variant: "destructive"
      });
    }
  };

  const deleteInstance = async (instanceName: string) => {
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        instanceName
      });

      const result = await service.deleteInstance();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Instância deletada com sucesso",
        });
        loadInstances(); // Recarregar lista
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao deletar instância",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar instância",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Instâncias</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas instâncias da Evolution API com webhooks N8N
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={validateN8nWebhook}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Webhook className="h-4 w-4" />
            Validar N8N
          </Button>
          <Button
            onClick={loadInstances}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status do Webhook N8N */}
      <Card className={cn(
        "border-2",
        isDarkMode ? "bg-[#18181b] border-gray-800" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-[#b5103c]" />
            Status do Sistema N8N
          </CardTitle>
          <CardDescription>
            Sistema de webhooks migrado para N8N para melhor performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              ✅ Sistema N8N Ativo
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              🔄 Webhooks Automáticos
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              📤 Envio Universal
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lista de instâncias */}
      <div className="grid gap-4">
        {instances.length === 0 && !loading ? (
          <Card className={cn(
            "text-center py-8",
            isDarkMode ? "bg-[#18181b] border-gray-800" : "bg-white border-gray-200"
          )}>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma instância encontrada
              </p>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card
              key={instance.instanceName}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedInstance === instance.instanceName && "ring-2 ring-[#b5103c]",
                isDarkMode ? "bg-[#18181b] border-gray-800 hover:bg-[#27272a]" : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => handleInstanceSelect(instance.instanceName)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {instance.connectionStatus === 'open' ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      {instance.instanceName}
                    </CardTitle>
                    <CardDescription>
                      {instance.profileName || 'Sem nome de perfil'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-white",
                        getStatusColor(instance.connectionStatus)
                      )}
                    >
                      {getStatusText(instance.connectionStatus)}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      N8N
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Servidor:</span>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {instance.serverUrl}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Integração:</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {instance.integration}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateQRCode(instance.instanceName);
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(instance.instanceName);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ isOpen: true, instanceName: instance.instanceName });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de QR Code */}
      {qrCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={cn(
            "bg-white dark:bg-[#18181b] p-6 rounded-lg max-w-md w-full mx-4",
            "border border-gray-200 dark:border-gray-800"
          )}>
            <h3 className="text-lg font-semibold mb-4">
              QR Code - {qrCodeModal.instanceName}
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={`data:image/png;base64,${qrCodeModal.qrCode}`}
                alt="QR Code"
                className="max-w-full h-auto"
              />
            </div>
            <Button
              onClick={() => setQrCodeModal(null)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <DeleteInstanceModal
        isOpen={deleteModal.isOpen}
        instanceName={deleteModal.instanceName}
        onClose={() => setDeleteModal({ isOpen: false, instanceName: '' })}
        onConfirm={() => {
          deleteInstance(deleteModal.instanceName);
          setDeleteModal({ isOpen: false, instanceName: '' });
        }}
      />
    </div>
  );
};

