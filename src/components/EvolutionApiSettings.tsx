import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { 
  Settings, 
  Wifi, 
  CheckCircle, 
  RotateCcw, 
  Plus, 
  QrCode, 
  Trash2, 
  LogOut, 
  Link, 
  Unlink 
} from 'lucide-react';
import { EvolutionApiService } from '@/services/EvolutionApiService';
import { useInternalChannels } from '@/hooks/useInternalChannels';
import { channelMappingService, ChannelInstanceMapping } from "@/services/ChannelInstanceMappingService";

interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
  instances: Array<{
    instanceName: string;
    status: string;
    profileName?: string;
  }>;
}

interface QrCodeModal {
  isOpen: boolean;
  qrCode: string;
  instanceName: string;
  loading: boolean;
}

export const EvolutionApiSettings: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const { channels: availableChannels } = useInternalChannels();

  const [apiConnection, setApiConnection] = useState<ApiConnection>({
    baseUrl: '',
    apiKey: '',
    isValidated: false,
    instances: []
  });

  const [validatingApi, setValidatingApi] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [deletingInstance, setDeletingInstance] = useState<string | null>(null);
  const [loggingOutInstance, setLoggingOutInstance] = useState<string | null>(null);
  
  const [qrCodeModal, setQrCodeModal] = useState<QrCodeModal>({
    isOpen: false,
    qrCode: '',
    instanceName: '',
    loading: false
  });

  const [selectedChannelForMapping, setSelectedChannelForMapping] = useState('');
  const [selectedInstanceForMapping, setSelectedInstanceForMapping] = useState('');
  const [linkingChannel, setLinkingChannel] = useState(false);
  const [channelMappings, setChannelMappings] = useState<ChannelInstanceMapping[]>([]);

  const loadChannelMappings = async () => {
    try {
      const mappings = await channelMappingService.getAllMappings();
      setChannelMappings(mappings);
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error);
    }
  };

  useEffect(() => {
    loadSavedApiConnection();
    loadChannelMappings();
  }, []);

  const loadSavedApiConnection = async () => {
    try {
      const saved = localStorage.getItem("evolution_api_connection");
      if (saved) {
        const connection = JSON.parse(saved);
        setApiConnection(connection);
        
        if (connection.isValidated) {
          await loadInstances(connection.baseUrl, connection.apiKey);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar conexão salva:", error);
    }
  };

  const validateApi = async () => {
    if (!apiConnection.baseUrl || !apiConnection.apiKey) {
      toast({
        title: "Erro",
        description: "Preencha a URL base e a API Key",
        variant: "destructive"
      });
      return;
    }

    setValidatingApi(true);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey
      });

      const result = await service.validateConnection();
      
      if (result.success) {
        const updatedConnection = {
          ...apiConnection,
          isValidated: true
        };
        
        setApiConnection(updatedConnection);
        localStorage.setItem("evolution_api_connection", JSON.stringify(updatedConnection));
        
        await loadInstances(apiConnection.baseUrl, apiConnection.apiKey);
        
        toast({
          title: "Sucesso",
          description: "API conectada com sucesso!",
        });
      } else {
        throw new Error(result.error || 'Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar API:', error);
      toast({
        title: "Erro",
        description: `Erro ao conectar: ${error}`,
        variant: "destructive"
      });
      
      setApiConnection(prev => ({ ...prev, isValidated: false }));
    } finally {
      setValidatingApi(false);
    }
  };

  const loadInstances = async (baseUrl: string, apiKey: string) => {
    try {
      const service = new EvolutionApiService({
        baseUrl,
        apiKey
      });

      const result = await service.listInstances();
      
      if (result.success && result.instances) {
        setApiConnection(prev => ({
          ...prev,
          instances: result.instances || []
        }));
      } else {
        console.error('Erro ao listar instâncias:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const createNewInstance = async () => {
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
        toast({
          title: "Sucesso",
          description: `Instância '${newInstanceName}' criada com sucesso!`,
        });

        setNewInstanceName('');
        await loadInstances(apiConnection.baseUrl, apiConnection.apiKey);
      } else {
        throw new Error(result.error || 'Erro ao criar instância');
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setCreatingInstance(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500 text-white">Conectado</Badge>;
      case 'close':
        return <Badge className="bg-red-500 text-white">Desconectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500 text-white">Conectando</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Desconhecido</Badge>;
    }
  };

  const linkChannelToInstance = async () => {
    if (!selectedChannelForMapping || !selectedInstanceForMapping) {
      toast({
        title: "Erro",
        description: "Selecione um canal e uma instância",
        variant: "destructive"
      });
      return;
    }

    setLinkingChannel(true);
    try {
      const selectedChannel = availableChannels.find(c => c.id === selectedChannelForMapping);
      
      const mapping: ChannelInstanceMapping = {
        channel_id: selectedChannelForMapping,
        instance_id: selectedInstanceForMapping,
        instance_name: selectedInstanceForMapping,
        channel_name: selectedChannel?.name || 'Canal',
        base_url: apiConnection.baseUrl,
        api_key: apiConnection.apiKey,
        is_active: true
      };

      await channelMappingService.createMapping(mapping);
      
      toast({
        title: "Sucesso",
        description: "Canal vinculado com sucesso!",
      });

      await loadChannelMappings();
      setSelectedChannelForMapping('');
      setSelectedInstanceForMapping('');
    } catch (error) {
      console.error("Erro ao vincular canal:", error);
      toast({
        title: "Erro",
        description: `Erro ao vincular canal: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLinkingChannel(false);
    }
  };

  const deleteInstance = async (instanceName: string) => {
    setDeletingInstance(instanceName);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName
      });

      const result = await service.deleteInstance(instanceName);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Instância '${instanceName}' removida com sucesso!`,
        });

        await loadInstances(apiConnection.baseUrl, apiConnection.apiKey);
      } else {
        throw new Error(result.error || 'Erro ao remover instância');
      }
    } catch (error) {
      console.error('Erro ao remover instância:', error);
      toast({
        title: "Erro",
        description: `Erro ao remover instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setDeletingInstance(null);
    }
  };

  const logoutInstance = async (instanceName: string) => {
    setLoggingOutInstance(instanceName);
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName
      });

      const result = await service.logoutInstance(instanceName);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Instância '${instanceName}' desconectada com sucesso!`,
        });

        await loadInstances(apiConnection.baseUrl, apiConnection.apiKey);
      } else {
        throw new Error(result.error || 'Erro ao desconectar instância');
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast({
        title: "Erro",
        description: `Erro ao desconectar instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoggingOutInstance(null);
    }
  };

  const unlinkChannel = async (mappingId: string) => {
    try {
      await channelMappingService.deleteMapping(mappingId);
      toast({
        title: "Sucesso",
        description: "Canal desvinculado com sucesso!",
      });
      await loadChannelMappings();
    } catch (error) {
      console.error("Erro ao desvincular canal:", error);
      toast({
        title: "Erro",
        description: `Erro ao desvincular canal: ${error}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("space-y-6", isDarkMode ? "text-white" : "text-gray-900")}>
      {/* SEÇÃO 1: Conectar API */}
      <Card className={cn(
        "border-2",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Conectar API Evolution
          </CardTitle>
          <CardDescription>
            Configure a conexão com a API Evolution para gerenciar instâncias do WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="baseUrl">URL Base da API</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://evolution.estudioonmp.com"
              value={apiConnection.baseUrl}
              onChange={(e) => setApiConnection(prev => ({ ...prev, baseUrl: e.target.value }))}
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
              onChange={(e) => setApiConnection(prev => ({ ...prev, apiKey: e.target.value }))}
              disabled={validatingApi}
              className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
              )}
            />
          </div>
          <Button
            onClick={validateApi}
            disabled={validatingApi || !apiConnection.baseUrl || !apiConnection.apiKey}
            className={cn(
              "w-full",
              apiConnection.isValidated 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            )}
          >
            {validatingApi ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : apiConnection.isValidated ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                API Conectada
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Conectar API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Gerenciar Instâncias */}
      {apiConnection.isValidated && (
        <Card className={cn(
          "border-2",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Gerenciar Instâncias
            </CardTitle>
            <CardDescription>
              Crie e gerencie instâncias do WhatsApp conectadas à API Evolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova instância"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                disabled={creatingInstance}
                className={cn(
                  "flex-1",
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              />
              <Button
                onClick={createNewInstance}
                disabled={creatingInstance || !newInstanceName.trim()}
                className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
              >
                {creatingInstance ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {apiConnection.instances.length > 0 && (
              <div className="space-y-3">
                <Label>Instâncias Disponíveis:</Label>
                {apiConnection.instances.map((instance) => (
                  <div
                    key={instance.instanceName}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-md",
                      isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusBadge(instance.status)}
                      <div>
                        <p className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                          {instance.instanceName}
                        </p>
                        {instance.profileName && (
                          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                            {instance.profileName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {instance.status === 'close' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              setQrCodeModal({
                                isOpen: true,
                                qrCode: '',
                                instanceName: instance.instanceName,
                                loading: true
                              });
                              
                              const service = new EvolutionApiService({
                                baseUrl: apiConnection.baseUrl,
                                apiKey: apiConnection.apiKey,
                                instanceName: instance.instanceName
                              });
                              
                              const qrResult = await service.getQRCodeForInstance(instance.instanceName);
                              if (qrResult.success && qrResult.qrCode) {
                                const qrCodeSrc = qrResult.qrCode.startsWith('data:image') 
                                  ? qrResult.qrCode 
                                  : `data:image/png;base64,${qrResult.qrCode}`;
                                
                                setQrCodeModal(prev => ({
                                  ...prev,
                                  qrCode: qrCodeSrc,
                                  loading: false
                                }));
                              } else {
                                setQrCodeModal(prev => ({ ...prev, loading: false }));
                                toast({
                                  title: "Erro",
                                  description: qrResult.error || "Erro ao obter QR Code",
                                  variant: "destructive"
                                });
                              }
                            } catch (error) {
                              setQrCodeModal(prev => ({ ...prev, loading: false }));
                              toast({
                                title: "Erro",
                                description: `Erro ao obter QR Code: ${error}`,
                                variant: "destructive"
                              });
                            }
                          }}
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
                          onClick={() => logoutInstance(instance.instanceName)}
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
                        onClick={() => deleteInstance(instance.instanceName)}
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
          </CardContent>
        </Card>
      )}

      {/* SEÇÃO 3: Vincular Canal à Instância */}
      {apiConnection.isValidated && (
        <Card className={cn(
          "border-2",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Vincular Canal à Instância
            </CardTitle>
            <CardDescription>
              Associe um canal de comunicação a uma instância da API Evolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="selectChannel">Selecionar Canal</Label>
                <Select
                  onValueChange={setSelectedChannelForMapping}
                  value={selectedChannelForMapping}
                  disabled={linkingChannel}
                >
                  <SelectTrigger
                    id="selectChannel"
                    className={cn(
                      isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                    )}
                  >
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300 text-gray-900")}>
                    {availableChannels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectInstance">Selecionar Instância</Label>
                <Select
                  onValueChange={setSelectedInstanceForMapping}
                  value={selectedInstanceForMapping}
                  disabled={linkingChannel}
                >
                  <SelectTrigger
                    id="selectInstance"
                    className={cn(
                      isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                    )}
                  >
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300 text-gray-900")}>
                    {apiConnection.instances.map(instance => (
                      <SelectItem key={instance.instanceName} value={instance.instanceName}>
                        {instance.instanceName}
                        {instance.profileName && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({instance.profileName})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={linkChannelToInstance}
              disabled={linkingChannel || !selectedChannelForMapping || !selectedInstanceForMapping}
              className="w-full bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {linkingChannel ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Vincular Canal
                </>
              )}
            </Button>

            {/* Lista de Canais Vinculados */}
            {channelMappings.length > 0 && (
              <div className="space-y-3">
                <Label>Canais Vinculados:</Label>
                {channelMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-md",
                      isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div>
                      <p className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                        {mapping.channel_name}
                      </p>
                      <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                        Instância: {mapping.instance_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={mapping.is_active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
                        {mapping.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unlinkChannel(mapping.id!)}
                        className={cn(
                          "border-red-500 text-red-600 hover:bg-red-50",
                          isDarkMode ? "border-red-400 text-red-400 hover:bg-red-900/20" : ""
                        )}
                      >
                        <Unlink className="mr-2 h-4 w-4" />
                        Desvincular
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal QR Code */}
      <Dialog open={qrCodeModal.isOpen} onOpenChange={(open) => setQrCodeModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conectar WhatsApp
            </DialogTitle>
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

