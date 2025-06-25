import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Settings, 
  Wifi, 
  RotateCcw, 
  CheckCircle, 
  Plus, 
  Trash2, 
  QrCode, 
  LogOut,
  RefreshCw,
  AlertCircle,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvolutionApiService, InstanceInfo } from '@/services/EvolutionApiService';
import { useChannels } from '@/contexts/ChannelContext';

interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
  instances: InstanceInfo[];
}

interface EvolutionApiManagerProps {
  isDarkMode?: boolean;
}

export const EvolutionApiManager: React.FC<EvolutionApiManagerProps> = ({ isDarkMode = false }) => {
  // Estado da conexão API
  const [apiConnection, setApiConnection] = useState<ApiConnection>({
    baseUrl: '',
    apiKey: '',
    isValidated: false,
    instances: []
  });

  // Estados de carregamento
  const [validatingApi, setValidatingApi] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [deletingInstance, setDeletingInstance] = useState<string | null>(null);
  const [disconnectingInstance, setDisconnectingInstance] = useState<string | null>(null);
  const [qrCodeInstance, setQrCodeInstance] = useState<{ instanceName: string; qrCode: string } | null>(null);

  // Estados do formulário
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedInstanceForWebhook, setSelectedInstanceForWebhook] = useState('');
  const [settingWebhook, setSettingWebhook] = useState(false);

  // Contexto de canais
  const { channels } = useChannels();

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('evolution-api-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setApiConnection(prev => ({
          ...prev,
          baseUrl: config.baseUrl || '',
          apiKey: config.apiKey || '',
          isValidated: config.isValidated || false
        }));
      } catch (error) {
        console.error('Erro ao carregar configuração salva:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  const saveConfig = (config: Partial<ApiConnection>) => {
    const configToSave = {
      baseUrl: config.baseUrl || apiConnection.baseUrl,
      apiKey: config.apiKey || apiConnection.apiKey,
      isValidated: config.isValidated || apiConnection.isValidated
    };
    localStorage.setItem('evolution-api-config', JSON.stringify(configToSave));
  };

  // Validar conexão com a API
  const handleValidateApi = async () => {
    if (!apiConnection.baseUrl || !apiConnection.apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a URL base e a API Key",
        variant: "destructive"
      });
      return;
    }

    setValidatingApi(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: 'temp'
      });

      const result = await service.validateConnection();
      
      if (result.success) {
        const updatedConnection = {
          ...apiConnection,
          isValidated: true
        };
        setApiConnection(updatedConnection);
        saveConfig(updatedConnection);
        
        toast({
          title: "Conexão validada!",
          description: "API Evolution conectada com sucesso",
          variant: "default"
        });

        // Carregar instâncias automaticamente
        await loadInstances();
      } else {
        toast({
          title: "Erro na validação",
          description: result.error || "Falha ao conectar com a API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Falha ao conectar com a API",
        variant: "destructive"
      });
    } finally {
      setValidatingApi(false);
    }
  };

  // Carregar instâncias
  const loadInstances = async () => {
    if (!apiConnection.isValidated) return;

    setLoadingInstances(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: 'temp'
      });

      const result = await service.listInstances();
      
      if (result.success && result.instances) {
        setApiConnection(prev => ({
          ...prev,
          instances: result.instances || []
        }));
      } else {
        toast({
          title: "Erro ao carregar instâncias",
          description: result.error || "Falha ao listar instâncias",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar instâncias",
        description: "Falha ao listar instâncias",
        variant: "destructive"
      });
    } finally {
      setLoadingInstances(false);
    }
  };

  // Criar nova instância
  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "Nome obrigatório",
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
        toast({
          title: "Instância criada!",
          description: `Instância "${newInstanceName}" criada com sucesso`,
          variant: "default"
        });
        setNewInstanceName('');
        await loadInstances();
      } else {
        toast({
          title: "Erro ao criar instância",
          description: result.error || "Falha ao criar instância",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao criar instância",
        description: "Falha ao criar instância",
        variant: "destructive"
      });
    } finally {
      setCreatingInstance(false);
    }
  };

  // Obter QR Code
  const handleGetQRCode = async (instanceName: string) => {
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: instanceName
      });

      const result = await service.getQRCodeForInstance(instanceName);
      
      if (result.success && result.qrCode) {
        setQrCodeInstance({
          instanceName,
          qrCode: result.qrCode
        });
      } else {
        toast({
          title: "Erro ao obter QR Code",
          description: result.error || "Falha ao obter QR Code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao obter QR Code",
        description: "Falha ao obter QR Code",
        variant: "destructive"
      });
    }
  };

  // Desconectar instância
  const handleDisconnectInstance = async (instanceName: string) => {
    setDisconnectingInstance(instanceName);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: instanceName
      });

      const result = await service.disconnectInstance(instanceName);
      
      if (result.success) {
        toast({
          title: "Instância desconectada!",
          description: `Instância "${instanceName}" desconectada com sucesso`,
          variant: "default"
        });
        await loadInstances();
      } else {
        toast({
          title: "Erro ao desconectar",
          description: result.error || "Falha ao desconectar instância",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao desconectar",
        description: "Falha ao desconectar instância",
        variant: "destructive"
      });
    } finally {
      setDisconnectingInstance(null);
    }
  };

  // Deletar instância
  const handleDeleteInstance = async (instanceName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a instância "${instanceName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

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
          title: "Instância deletada!",
          description: `Instância "${instanceName}" deletada com sucesso`,
          variant: "default"
        });
        await loadInstances();
      } else {
        toast({
          title: "Erro ao deletar",
          description: result.error || "Falha ao deletar instância",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar",
        description: "Falha ao deletar instância",
        variant: "destructive"
      });
    } finally {
      setDeletingInstance(null);
    }
  };

  // Configurar webhook
  const handleSetWebhook = async () => {
    if (!selectedChannel || !selectedInstanceForWebhook) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione um canal e uma instância",
        variant: "destructive"
      });
      return;
    }

    setSettingWebhook(true);
    try {
      const channel = channels.find(c => c.id === selectedChannel);
      const webhookUrl = channel?.webhookUrl || 'https://n8n.estudioonmp.com/webhook/default';
      
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: selectedInstanceForWebhook
      });

      const events = ['MESSAGES_UPSERT', 'GROUPS_UPSERT'];
      const result = await service.setWebhook(webhookUrl, events);
      
      if (result.success) {
        toast({
          title: "Webhook configurado!",
          description: `Webhook configurado para a instância "${selectedInstanceForWebhook}"`,
          variant: "default"
        });
        setSelectedChannel('');
        setSelectedInstanceForWebhook('');
      } else {
        toast({
          title: "Erro ao configurar webhook",
          description: result.error || "Falha ao configurar webhook",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao configurar webhook",
        description: "Falha ao configurar webhook",
        variant: "destructive"
      });
    } finally {
      setSettingWebhook(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
      default:
        return 'text-red-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção de Conexão com API */}
      <Card className={cn(
        "border-2",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Conexão com API Evolution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseUrl">URL Base da API</Label>
              <Input
                id="baseUrl"
                placeholder="https://evolution.estudioonmp.com"
                value={apiConnection.baseUrl}
                onChange={(e) => setApiConnection({
                  ...apiConnection,
                  baseUrl: e.target.value,
                  isValidated: false
                })}
                disabled={validatingApi}
                className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua API Key"
                value={apiConnection.apiKey}
                onChange={(e) => setApiConnection({
                  ...apiConnection,
                  apiKey: e.target.value,
                  isValidated: false
                })}
                disabled={validatingApi}
                className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              />
            </div>
          </div>
          <Button
            onClick={handleValidateApi}
            disabled={validatingApi}
            className="w-full"
          >
            {validatingApi ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : apiConnection.isValidated ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                API Validada
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Validar Conexão
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Seção de Instâncias */}
      {apiConnection.isValidated && (
        <Card className={cn(
          "border-2",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Instâncias
              <Button
                onClick={loadInstances}
                disabled={loadingInstances}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                {loadingInstances ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Criar nova instância */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova instância"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                disabled={creatingInstance}
                className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              />
              <Button
                onClick={handleCreateInstance}
                disabled={creatingInstance || !newInstanceName.trim()}
              >
                {creatingInstance ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Lista de instâncias */}
            <div className="space-y-2">
              {apiConnection.instances.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhuma instância encontrada
                </p>
              ) : (
                apiConnection.instances.map((instance) => (
                  <div
                    key={instance.instanceName}
                    className={cn(
                      "p-4 border rounded-lg",
                      isDarkMode ? "border-[#3f3f46] bg-[#27272a]" : "border-gray-200 bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{instance.instanceName}</h4>
                        <p className={cn(
                          "text-sm",
                          getStatusColor(instance.connectionStatus)
                        )}>
                          {getStatusText(instance.connectionStatus)}
                          {instance.profileName && ` - ${instance.profileName}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {instance.connectionStatus === 'connected' ? (
                          <>
                            <Button
                              onClick={() => handleDisconnectInstance(instance.instanceName)}
                              disabled={disconnectingInstance === instance.instanceName}
                              variant="outline"
                              size="sm"
                            >
                              {disconnectingInstance === instance.instanceName ? (
                                <RotateCcw className="h-4 w-4 animate-spin" />
                              ) : (
                                <LogOut className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleDeleteInstance(instance.instanceName)}
                              disabled={deletingInstance === instance.instanceName}
                              variant="destructive"
                              size="sm"
                            >
                              {deletingInstance === instance.instanceName ? (
                                <RotateCcw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleGetQRCode(instance.instanceName)}
                              variant="outline"
                              size="sm"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteInstance(instance.instanceName)}
                              disabled={deletingInstance === instance.instanceName}
                              variant="destructive"
                              size="sm"
                            >
                              {deletingInstance === instance.instanceName ? (
                                <RotateCcw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Configurar Webhook */}
      {apiConnection.isValidated && apiConnection.instances.length > 0 && (
        <Card className={cn(
          "border-2",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Configurar Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Canal</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                  )}>
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.filter(c => c.isActive).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Instância</Label>
                <Select value={selectedInstanceForWebhook} onValueChange={setSelectedInstanceForWebhook}>
                  <SelectTrigger className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                  )}>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiConnection.instances.map((instance) => (
                      <SelectItem key={instance.instanceName} value={instance.instanceName}>
                        {instance.instanceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={handleSetWebhook}
              disabled={settingWebhook || !selectedChannel || !selectedInstanceForWebhook}
              className="w-full"
            >
              {settingWebhook ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Configurar Webhook
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal do QR Code */}
      {qrCodeInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={cn(
            "p-6 rounded-lg shadow-lg max-w-md w-full mx-4",
            isDarkMode ? "bg-[#18181b]" : "bg-white"
          )}>
            <h3 className="text-lg font-medium mb-4 text-center">
              QR Code - {qrCodeInstance.instanceName}
            </h3>
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-600">
                Escaneie o QR Code com o WhatsApp para conectar esta instância
              </p>
              <div className="mb-4 flex justify-center">
                <img 
                  src={qrCodeInstance.qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 border rounded"
                />
              </div>
              <Button
                onClick={() => setQrCodeInstance(null)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

