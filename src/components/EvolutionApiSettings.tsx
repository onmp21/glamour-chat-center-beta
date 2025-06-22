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

interface EvolutionApiSettingsProps {
  isDarkMode?: boolean;
  channelId?: string;
}

export const EvolutionApiSettings: React.FC<EvolutionApiSettingsProps> = ({ 
  isDarkMode = false,
  channelId = "default"
}) => {
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
  const [loadingInstances, setLoadingInstances] = useState(false);
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

  // Load existing mappings
  useEffect(() => {
    loadChannelMappings();
  }, []);

  const loadChannelMappings = async () => {
    try {
      const mappings = await channelMappingService.getAllMappings();
      setChannelMappings(mappings);
    } catch (error) {
      console.error('Error loading channel mappings:', error);
    }
  };

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
        setApiConnection(prev => ({
          ...prev,
          instances: result.instances.map(instance => ({
            instanceName: instance.instanceName,
            status: instance.status || 'unknown',
            profileName: instance.profileName
          }))
        }));
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
    setQrCodeModal({
      isOpen: true,
      qrCode: '',
      instanceName,
      loading: true
    });

    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName
      });

      const result = await service.getQRCodeForInstance(instanceName);
      
      if (result.success && result.qrCode) {
        setQrCodeModal(prev => ({
          ...prev,
          qrCode: result.qrCode!,
          loading: false
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao gerar QR Code: ${error}`,
        variant: "destructive"
      });
      setQrCodeModal(prev => ({ ...prev, isOpen: false, loading: false }));
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
          title: "Instância removida",
          description: `Instância ${instanceName} removida com sucesso`
        });
        await loadInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
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

      const result = await service.disconnectInstance(instanceName);
      
      if (result.success) {
        toast({
          title: "Instância desconectada",
          description: `Instância ${instanceName} desconectada com sucesso`
        });
        await loadInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao desconectar instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoggingOutInstance(null);
    }
  };

  const linkChannelToInstance = async () => {
    if (!selectedChannelForMapping || !selectedInstanceForMapping) {
      toast({
        title: "Erro",
        description: "Selecione canal e instância",
        variant: "destructive"
      });
      return;
    }

    setLinkingChannel(true);
    try {
      await channelMappingService.createMapping({
        channel_id: selectedChannelForMapping,
        channel_name: availableChannels.find(c => c.id === selectedChannelForMapping)?.name || '',
        instance_id: selectedInstanceForMapping,
        instance_name: selectedInstanceForMapping,
        base_url: apiConnection.baseUrl,
        api_key: apiConnection.apiKey,
        is_active: true
      });

      toast({
        title: "Canal vinculado",
        description: "Canal vinculado à instância com sucesso"
      });

      setSelectedChannelForMapping('');
      setSelectedInstanceForMapping('');
      await loadChannelMappings();
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao vincular canal: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLinkingChannel(false);
    }
  };

  const unlinkChannel = async (mappingId: string) => {
    try {
      await channelMappingService.deleteMapping(mappingId);
      toast({
        title: "Canal desvinculado",
        description: "Canal desvinculado da instância"
      });
      await loadChannelMappings();
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao desvincular canal: ${error}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* API Connection */}
      <Card className={cn(
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração da API Evolution
          </CardTitle>
          <CardDescription>
            Configure a conexão com a API Evolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL Base da API</Label>
              <Input
                id="baseUrl"
                placeholder="https://sua-api.com"
                value={apiConnection.baseUrl}
                onChange={(e) => setApiConnection(prev => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua chave da API"
                value={apiConnection.apiKey}
                onChange={(e) => setApiConnection(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={validateApiConnection}
              disabled={validatingApi}
              variant={apiConnection.isValidated ? "outline" : "default"}
            >
              {validatingApi ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : apiConnection.isValidated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reconectar
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
            
            {apiConnection.isValidated && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instance Management */}
      {apiConnection.isValidated && (
        <>
          <Card className={cn(
            isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Gerenciar Instâncias
              </CardTitle>
              <CardDescription>
                Criar e gerenciar instâncias do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da nova instância"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                />
                <Button 
                  onClick={createInstance}
                  disabled={creatingInstance}
                >
                  {creatingInstance ? 'Criando...' : 'Criar'}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Instâncias Existentes</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadInstances}
                    disabled={loadingInstances}
                  >
                    {loadingInstances ? (
                      <RotateCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Atualizar'
                    )}
                  </Button>
                </div>

                {apiConnection.instances.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma instância encontrada</p>
                ) : (
                  <div className="space-y-2">
                    {apiConnection.instances.map((instance) => (
                      <div 
                        key={instance.instanceName}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg",
                          isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            instance.status === 'open' ? "bg-green-500" : "bg-red-500"
                          )} />
                          <div>
                            <p className="font-medium">{instance.instanceName}</p>
                            <p className="text-sm text-gray-500">
                              Status: {instance.status} {instance.profileName && `• ${instance.profileName}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateQRCode(instance.instanceName)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logoutInstance(instance.instanceName)}
                            disabled={loggingOutInstance === instance.instanceName}
                          >
                            {loggingOutInstance === instance.instanceName ? (
                              <RotateCcw className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogOut className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteInstance(instance.instanceName)}
                            disabled={deletingInstance === instance.instanceName}
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Channel Mapping */}
          <Card className={cn(
            isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Vincular Canais
              </CardTitle>
              <CardDescription>
                Vincule canais às instâncias do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select 
                    value={selectedChannelForMapping} 
                    onValueChange={setSelectedChannelForMapping}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChannels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Instância</Label>
                  <Select 
                    value={selectedInstanceForMapping} 
                    onValueChange={setSelectedInstanceForMapping}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiConnection.instances.map((instance) => (
                        <SelectItem key={instance.instanceName} value={instance.instanceName}>
                          {instance.instanceName} ({instance.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={linkChannelToInstance}
                    disabled={linkingChannel}
                    className="w-full"
                  >
                    {linkingChannel ? 'Vinculando...' : 'Vincular'}
                  </Button>
                </div>
              </div>

              {/* Current Mappings */}
              {channelMappings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Vínculos Ativos</h4>
                  <div className="space-y-2">
                    {channelMappings.map((mapping) => (
                      <div 
                        key={mapping.id}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg",
                          isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
                        )}
                      >
                        <div>
                          <p className="font-medium">{mapping.channel_name}</p>
                          <p className="text-sm text-gray-500">→ {mapping.instance_name}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkChannel(mapping.id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* QR Code Modal */}
      <Dialog open={qrCodeModal.isOpen} onOpenChange={(open) => setQrCodeModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {qrCodeModal.instanceName}</DialogTitle>
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
