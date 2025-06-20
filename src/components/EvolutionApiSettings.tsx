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
        apiKey: apiConnection.apiKey,
        instanceName: 'temp' // Temporary instance name for validation
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
        apiKey,
        instanceName: 'temp' // Temporary instance name for listing
      });

      const result = await service.listInstances();
      console.log('📋 [EvolutionApiSettings] Resultado de listInstances:', result);
      
      if (result.success && result.instances) {
        console.log('📋 [EvolutionApiSettings] Instâncias recebidas:', result.instances);
        setApiConnection(prev => ({
          ...prev,
          instances: result.instances || []
        }));
      } else {
        console.error('Erro ao listar instâncias:', result.error);
        setApiConnection(prev => ({
          ...prev,
          instances: []
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      setApiConnection(prev => ({
        ...prev,
        instances: []
      }));
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
      
      const mapping: Partial<ChannelInstanceMapping> = {
        channel_id: selectedChannelForMapping,
        instance_id: selectedInstanceForMapping,
        instance_name: selectedInstanceForMapping,
        channel_name: selectedChannel?.name || 'Canal',
        base_url: apiConnection.baseUrl,
        api_key: apiConnection.apiKey,
        is_active: true
      };

      await channelMappingService.createMapping(mapping as ChannelInstanceMapping);

      // Configurar webhook para a instância recém-vinculada
      const evolutionService = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: selectedInstanceForMapping
      });
      const webhookResult = await evolutionService.setWebhookForChannel(selectedChannel?.name || "");

      if (!webhookResult.success) {
        console.error("Erro ao configurar webhook:", webhookResult.error);
        toast({
          title: "Aviso",
          description: `Canal vinculado, mas houve um erro ao configurar o webhook: ${webhookResult.error}`,
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Canal vinculado e webhook configurado com sucesso!",
        });
      }

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

  const disconnectInstance = async (instanceName: string) => {
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

  const getQRCode = async (instanceName: string) => {
    setQrCodeModal(prev => ({ ...prev, isOpen: true, instanceName, loading: true }));
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName
      });
      const result = await service.getQRCodeForInstance(instanceName);
      if (result.success && result.qrCode) {
        setQrCodeModal(prev => ({ ...prev, qrCode: result.qrCode, loading: false }));
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao obter QR Code",
          variant: "destructive"
        });
        setQrCodeModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      toast({
        title: "Erro",
        description: `Erro ao obter QR Code: ${error}`,
        variant: "destructive"
      });
      setQrCodeModal(prev => ({ ...prev, isOpen: false, loading: false }));
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
            <div className="flex space-x-2">
              <Input
                placeholder="Nome da nova instância"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              />
              <Button
                onClick={createNewInstance}
                disabled={creatingInstance || !newInstanceName.trim()}
                className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
              >
                {creatingInstance ? (
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Criar Instância
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Instâncias Existentes:</h4>
              {apiConnection.instances.length === 0 ? (
                <p className="text-gray-500">Nenhuma instância encontrada.</p>
              ) : (
                <ul className="space-y-2">
                  {apiConnection.instances.map((instance) => (
                    <li 
                      key={instance.instanceName} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md",
                        isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{instance.instanceName}</span>
                        {getStatusBadge(instance.status)}
                        {instance.profileName && (
                          <span className="text-sm text-gray-500">({instance.profileName})</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => getQRCode(instance.instanceName)}
                          disabled={qrCodeModal.loading}
                          className={cn(
                            isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#3f3f46]" : "border-gray-300 hover:bg-gray-200"
                          )}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => disconnectInstance(instance.instanceName)}
                          disabled={loggingOutInstance === instance.instanceName}
                          className={cn(
                            isDarkMode ? "border-[#3f3f46] text-white hover:bg-[#3f3f46]" : "border-gray-300 hover:bg-gray-200"
                          )}
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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEÇÃO 3: Mapear Canais para Instâncias */}
      {apiConnection.isValidated && (
        <Card className={cn(
          "border-2",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Mapear Canais para Instâncias
            </CardTitle>
            <CardDescription>
              Vincule canais internos a instâncias da API Evolution para roteamento de mensagens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="selectChannel">Selecionar Canal Interno</Label>
                <Select
                  onValueChange={setSelectedChannelForMapping}
                  value={selectedChannelForMapping}
                >
                  <SelectTrigger className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                  )}>
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300 text-gray-900"
                  )}>
                    {availableChannels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectInstance">Selecionar Instância Evolution</Label>
                <Select
                  onValueChange={setSelectedInstanceForMapping}
                  value={selectedInstanceForMapping}
                >
                  <SelectTrigger className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                  )}>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300 text-gray-900"
                  )}>
                    {apiConnection.instances.map(instance => (
                      <SelectItem key={instance.instanceName} value={instance.instanceName}>
                        {instance.instanceName}
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
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link className="mr-2 h-4 w-4" />
              )}
              Vincular Canal à Instância
            </Button>

            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Mapeamentos Ativos:</h4>
              {channelMappings.length === 0 ? (
                <p className="text-gray-500">Nenhum mapeamento ativo.</p>
              ) : (
                <ul className="space-y-2">
                  {channelMappings.map((mapping) => (
                    <li 
                      key={mapping.channel_id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md",
                        isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{mapping.channel_name}</span>
                        <span className="text-sm text-gray-500">para</span>
                        <span className="font-medium">{mapping.instance_name}</span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => unlinkChannel(mapping.channel_id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de QR Code */}
      <Dialog open={qrCodeModal.isOpen} onOpenChange={() => setQrCodeModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className={cn(
          isDarkMode ? "bg-[#18181b] text-white border-[#3f3f46]" : "bg-white text-gray-900 border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle>QR Code para {qrCodeModal.instanceName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {qrCodeModal.loading ? (
              <RotateCcw className="h-12 w-12 animate-spin text-[#b5103c]" />
            ) : qrCodeModal.qrCode ? (
              <img src={qrCodeModal.qrCode} alt="QR Code" className="w-64 h-64" />
            ) : (
              <p className="text-red-500">Não foi possível carregar o QR Code.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
