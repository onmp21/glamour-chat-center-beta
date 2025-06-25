import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Settings, Wifi, WifiOff, CheckCircle, RotateCcw, Plus, QrCode, Trash2, LogOut, Link, Unlink } from 'lucide-react';
import { EvolutionApiService } from '@/services/EvolutionApiService';
import { useInternalChannels } from '@/hooks/useInternalChannels';
import { supabase } from '@/integrations/supabase/client';
interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
  instances: Array<{
    id: string;
    instanceName: string;
    status: string;
    profileName?: string;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'unknown';
  }>;
}
interface QrCodeModal {
  isOpen: boolean;
  qrCode: string;
  instanceName: string;
  loading: boolean;
}
interface ApiInstanceFromDb {
  id: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}
interface EvolutionApiSettingsProps {
  isDarkMode?: boolean;
  channelId?: string;
}
export const EvolutionApiSettings: React.FC<EvolutionApiSettingsProps> = ({
  isDarkMode = false,
  channelId = "default"
}) => {
  const {
    toast
  } = useToast();
  const {
    channels: availableChannels
  } = useInternalChannels();
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
  const [savedApiInstances, setSavedApiInstances] = useState<ApiInstanceFromDb[]>([]);
  const [selectedApiInstance, setSelectedApiInstance] = useState<string>('');

  // Carregar instâncias salvas da tabela api_instances
  useEffect(() => {
    loadSavedApiInstances();
  }, []);
  const loadSavedApiInstances = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('api_instances').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error loading API instances:', error);
        return;
      }
      setSavedApiInstances(data || []);

      // Se tem instâncias salvas, usar a primeira por padrão
      if (data && data.length > 0 && !selectedApiInstance) {
        const firstInstance = data[0];
        setSelectedApiInstance(firstInstance.id);
        setApiConnection(prev => ({
          ...prev,
          baseUrl: firstInstance.base_url,
          apiKey: firstInstance.api_key
        }));
      }
    } catch (error) {
      console.error('Error loading API instances:', error);
    }
  };
  const saveApiInstance = async () => {
    if (!apiConnection.baseUrl || !apiConnection.apiKey) {
      toast({
        title: "Erro",
        description: "Preencha URL e API Key antes de salvar",
        variant: "destructive"
      });
      return;
    }
    try {
      const instanceName = apiConnection.baseUrl.split('://')[1]?.split('.')[0] || 'evolution-api';
      const {
        data,
        error
      } = await supabase.from('api_instances').insert({
        instance_name: instanceName,
        base_url: apiConnection.baseUrl,
        api_key: apiConnection.apiKey
      }).select().single();
      if (error) {
        throw error;
      }
      toast({
        title: "Sucesso",
        description: "Configuração da API salva com sucesso"
      });
      await loadSavedApiInstances();
      setSelectedApiInstance(data.id);
    } catch (error) {
      console.error('Error saving API instance:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração da API",
        variant: "destructive"
      });
    }
  };
  const handleApiInstanceChange = (instanceId: string) => {
    const instance = savedApiInstances.find(inst => inst.id === instanceId);
    if (instance) {
      setSelectedApiInstance(instanceId);
      setApiConnection(prev => ({
        ...prev,
        baseUrl: instance.base_url,
        apiKey: instance.api_key,
        isValidated: false,
        instances: []
      }));
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
        setApiConnection(prev => ({
          ...prev,
          isValidated: true
        }));
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
            id: instance.instanceName,
            // Usando instanceName como ID
            instanceName: instance.instanceName,
            status: instance.status || 'close',
            profileName: instance.profileName,
            connectionStatus: instance.connectionStatus || 'unknown'
          }))
        }));
        console.log('✅ [EVOLUTION_SETTINGS] Instances loaded:', result.instances);
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
          qrCode: result.qrCode,
          loading: false
        }));
      } else {
        throw new Error(result.error || 'QR Code não disponível');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro",
        description: `Erro ao gerar QR Code: ${error}`,
        variant: "destructive"
      });
      setQrCodeModal(prev => ({
        ...prev,
        loading: false
      }));
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
          title: "Instância excluída",
          description: `Instância ${instanceName} excluída com sucesso`
        });
        await loadInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setDeletingInstance(null);
    }
  };
  const setWebhookForChannel = async () => {
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
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: selectedInstanceForMapping
      });
      const result = await service.setWebhook();
      if (result.success) {
        toast({
          title: "Webhook configurado",
          description: `Webhook configurado para ${selectedInstanceForMapping} com eventos: Webhook Base64, GROUPS_UPSERT, MESSAGES_UPSERT`
        });
        setSelectedChannelForMapping('');
        setSelectedInstanceForMapping('');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error setting webhook:', error);
      toast({
        title: "Erro",
        description: `Erro ao configurar webhook: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLinkingChannel(false);
    }
  };
  const getStatusBadge = (connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'unknown') => {
    const config = {
      connected: {
        variant: 'default' as const,
        icon: Wifi,
        label: 'Conectado'
      },
      disconnected: {
        variant: 'destructive' as const,
        icon: WifiOff,
        label: 'Desconectado'
      },
      connecting: {
        variant: 'secondary' as const,
        icon: RotateCcw,
        label: 'Conectando'
      },
      unknown: {
        variant: 'secondary' as const,
        icon: WifiOff,
        label: 'Desconhecido'
      }
    };
    const {
      variant,
      icon: Icon,
      label
    } = config[connectionStatus];
    return <Badge variant={variant} className="flex items-center gap-1">
        <Icon size={12} />
        {label}
      </Badge>;
  };
  return <div className={cn("space-y-6", isDarkMode ? "text-white" : "text-gray-900")}>
      

      {/* Seleção de configuração salva */}
      

      {/* Configuração da API */}
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
            <Input id="base-url" placeholder="https://evolution.estudioonmp.com" value={apiConnection.baseUrl} onChange={e => setApiConnection(prev => ({
            ...prev,
            baseUrl: e.target.value,
            isValidated: false
          }))} className={isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input id="api-key" type="password" placeholder="Sua API Key" value={apiConnection.apiKey} onChange={e => setApiConnection(prev => ({
            ...prev,
            apiKey: e.target.value,
            isValidated: false
          }))} className={isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""} />
          </div>

          <div className="flex gap-2">
            <Button onClick={validateApiConnection} disabled={validatingApi || !apiConnection.baseUrl || !apiConnection.apiKey} className="flex items-center gap-2">
              {validatingApi ? <RotateCcw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {validatingApi ? 'Validando...' : 'Validar Conexão'}
            </Button>

            <Button onClick={saveApiInstance} variant="outline" disabled={!apiConnection.baseUrl || !apiConnection.apiKey}>
              Salvar Configuração
            </Button>
          </div>

          {apiConnection.isValidated && <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Conexão validada com sucesso</span>
            </div>}
        </CardContent>
      </Card>

      {/* Gerenciamento de Instâncias */}
      {apiConnection.isValidated && <Card className={isDarkMode ? "bg-[#18181b] border-[#27272a]" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Instâncias WhatsApp</span>
              <Button onClick={loadInstances} variant="outline" size="sm" disabled={loadingInstances}>
                {loadingInstances ? <RotateCcw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Atualizar
              </Button>
            </CardTitle>
            <CardDescription>
              Gerencie suas instâncias do WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Criar nova instância */}
            <div className="flex gap-2">
              <Input placeholder="Nome da nova instância" value={newInstanceName} onChange={e => setNewInstanceName(e.target.value)} className={isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""} />
              <Button onClick={createInstance} disabled={creatingInstance || !newInstanceName.trim()}>
                {creatingInstance ? <RotateCcw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar
              </Button>
            </div>

            {/* Lista de instâncias */}
            <div className="space-y-2">
              {apiConnection.instances.map(instance => <div key={instance.instanceName} className={cn("flex items-center justify-between p-3 rounded-lg border", isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200")}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{instance.instanceName}</p>
                      {instance.profileName && <p className="text-sm text-gray-500">{instance.profileName}</p>}
                    </div>
                    {getStatusBadge(instance.connectionStatus)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={() => generateQRCode(instance.instanceName)} variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-1" />
                      QR Code
                    </Button>

                    <Button onClick={() => deleteInstance(instance.instanceName)} variant="outline" size="sm" disabled={deletingInstance === instance.instanceName} className="text-red-600 hover:text-red-700">
                      {deletingInstance === instance.instanceName ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>)}

              {apiConnection.instances.length === 0 && <p className="text-center text-gray-500 py-4">
                  Nenhuma instância encontrada. Crie uma nova instância para começar.
                </p>}
            </div>
          </CardContent>
        </Card>}

      {/* Configuração de Webhook */}
      {apiConnection.isValidated && apiConnection.instances.length > 0 && <Card className={isDarkMode ? "bg-[#18181b] border-[#27272a]" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Configurar Webhook
            </CardTitle>
            <CardDescription>
              Configure webhook com eventos: Webhook Base64, GROUPS_UPSERT, MESSAGES_UPSERT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={selectedChannelForMapping} onValueChange={setSelectedChannelForMapping}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannels.map(channel => <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Instância</Label>
                <Select value={selectedInstanceForMapping} onValueChange={setSelectedInstanceForMapping}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiConnection.instances.map(instance => <SelectItem key={instance.id} value={instance.id}>
                        {instance.instanceName}
                        {instance.profileName && <span className="text-xs text-gray-400 ml-1">
                            ({instance.profileName})
                          </span>}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={setWebhookForChannel} disabled={linkingChannel || !selectedChannelForMapping || !selectedInstanceForMapping} className="w-full">
              {linkingChannel ? <RotateCcw className="h-4 w-4 animate-spin mr-2" /> : <Link className="h-4 w-4 mr-2" />}
              {linkingChannel ? 'Configurando...' : 'Configurar Webhook'}
            </Button>
          </CardContent>
        </Card>}

      {/* Modal do QR Code */}
      <Dialog open={qrCodeModal.isOpen} onOpenChange={open => setQrCodeModal(prev => ({
      ...prev,
      isOpen: open
    }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conectar WhatsApp - {qrCodeModal.instanceName}
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar a instância
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            {qrCodeModal.loading ? <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Gerando QR Code...</span>
              </div> : qrCodeModal.qrCode ? <>
                <img src={qrCodeModal.qrCode} alt="QR Code WhatsApp" className="w-64 h-64 border border-gray-300 rounded-lg" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">Escaneie com seu WhatsApp</p>
                  <p className="text-xs text-gray-500">Instância: {qrCodeModal.instanceName}</p>
                  <p className="text-xs text-gray-400">QR Code expira em alguns minutos</p>
                </div>
              </> : <p className="text-red-500">Erro ao carregar QR Code</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};