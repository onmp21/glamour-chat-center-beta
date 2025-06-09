import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { QrCode, Wifi, WifiOff, Settings, Trash2, RotateCcw, Plus, Link, Unlink, Edit, CheckCircle, AlertCircle, X } from 'lucide-react';
import { EvolutionApiService, EvolutionApiConfig, evolutionApiManager, InstanceInfo } from '@/services/EvolutionApiService';
import { ChannelInstanceMappingService, ChannelInstanceMapping } from '@/services/ChannelInstanceMappingService';

interface EvolutionApiSettingsProps {
  isDarkMode: boolean;
  channelId: string;
  onClose?: () => void;
}

interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
  instances: InstanceInfo[];
}

interface ChannelMapping {
  id: string;
  channelId: string;
  instanceId: string;
  instanceName: string;
  channelName: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const EvolutionApiSettings: React.FC<EvolutionApiSettingsProps> = ({
  isDarkMode,
  channelId,
  onClose
}) => {
  const { toast } = useToast();
  
  // Estados para as 3 seções
  const [apiConnection, setApiConnection] = useState<ApiConnection>({
    baseUrl: 'https://evolution.estudioonmp.com',
    apiKey: '',
    isValidated: false,
    instances: []
  });
  
  // Estados para QR Code Modal
  const [qrCodeModal, setQrCodeModal] = useState({
    isOpen: false,
    qrCode: '',
    instanceName: '',
    loading: false
  });
  
  const [newInstanceName, setNewInstanceName] = useState('');
  const [channelMappings, setChannelMappings] = useState<ChannelMapping[]>([]);
  const [selectedChannelForMapping, setSelectedChannelForMapping] = useState<string>('');
  const [selectedInstanceForMapping, setSelectedInstanceForMapping] = useState<string>('');
  
  // Estados de loading
  const [validatingApi, setValidatingApi] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [deletingInstance, setDeletingInstance] = useState<string | null>(null);
  const [linkingChannel, setLinkingChannel] = useState(false);
  
  const channelMappingService = new ChannelInstanceMappingService();
  const availableChannels = channelMappingService.getAvailableChannels();

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔄 [EVOLUTION_API_SETTINGS] Componente montado, carregando dados...');
    loadSavedApiConnection();
    loadChannelMappings();
  }, []);

  const loadSavedApiConnection = () => {
    try {
      const saved = localStorage.getItem('evolution_api_connection');
      if (saved) {
        const connection = JSON.parse(saved);
        console.log('📂 [EVOLUTION_API_SETTINGS] Conexão salva carregada:', connection);
        setApiConnection(connection);
        
        // Se já validado, carregar instâncias
        if (connection.isValidated) {
          console.log('📂 [EVOLUTION_API_SETTINGS] Conexão validada, carregando instâncias...');
          loadInstances(connection.baseUrl, connection.apiKey);
        }
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SETTINGS] Erro ao carregar conexão:', error);
    }
  };

  const loadChannelMappings = async () => {
    try {
      const mappings = await channelMappingService.getAllMappings();
      const transformedMappings = mappings.map(mapping => ({
        id: mapping.id || '',
        channelId: mapping.channel_id,
        instanceId: mapping.instance_id,
        instanceName: mapping.instance_name,
        channelName: mapping.channel_name,
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        isActive: mapping.is_active,
        createdAt: mapping.created_at || '',
        updatedAt: mapping.updated_at || ''
      }));
      setChannelMappings(transformedMappings);
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SETTINGS] Erro ao carregar mapeamentos:', error);
    }
  };

  const loadInstances = async (baseUrl: string, apiKey: string) => {
    try {
      console.log('📋 [EVOLUTION_API_SETTINGS] Carregando instâncias...');
      const service = new EvolutionApiService({
        baseUrl,
        apiKey,
        instanceName: 'temp'
      });
      
      const result = await service.listInstances();
      console.log('📋 [EVOLUTION_API_SETTINGS] Resultado de listInstances:', result);
      if (result.success && result.instances) {
        console.log('✅ [EVOLUTION_API_SETTINGS] Instâncias carregadas:', result.instances);
        setApiConnection(prev => ({
          ...prev,
          instances: result.instances || []
        }));
      } else {
        console.error('❌ [EVOLUTION_API_SETTINGS] Erro ao carregar instâncias, resultado:', result);
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SETTINGS] Erro ao carregar instâncias:', error);
    }
  };

  const saveApiConnection = (connection: ApiConnection) => {
    try {
      localStorage.setItem('evolution_api_connection', JSON.stringify(connection));
      console.log('💾 [EVOLUTION_API_SETTINGS] Conexão salva:', connection);
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SETTINGS] Erro ao salvar conexão:', error);
    }
  };

  // SEÇÃO 1: Conectar API
  const validateApi = async () => {
    console.log('🔍 [EVOLUTION_API_SETTINGS] Iniciando validação da API...');
    
    if (!apiConnection.baseUrl || !apiConnection.apiKey) {
      console.log('❌ [EVOLUTION_API_SETTINGS] URL ou API Key não preenchidos');
      toast({
        title: "Erro",
        description: "URL base e API Key são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setValidatingApi(true);
    try {
      console.log('🔗 [EVOLUTION_API_SETTINGS] Criando serviço com:', {
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey.substring(0, 10) + '...'
      });

      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl.replace(/\/$/, ''),
        apiKey: apiConnection.apiKey,
        instanceName: 'temp'
      });

      console.log('🔍 [EVOLUTION_API_SETTINGS] Validando API...');
      const result = await service.validateApi();
      
      if (result.success) {
        console.log('✅ [EVOLUTION_API_SETTINGS] API validada com sucesso!');
        
        // Carregar instâncias após validação
        console.log('📋 [EVOLUTION_API_SETTINGS] Carregando instâncias após validação...');
        const instancesResult = await service.listInstances();
        console.log('📋 [EVOLUTION_API_SETTINGS] Resultado do carregamento de instâncias:', instancesResult);
        
        const validatedConnection: ApiConnection = {
          baseUrl: apiConnection.baseUrl.replace(/\/$/, ''),
          apiKey: apiConnection.apiKey,
          isValidated: true,
          instances: instancesResult.instances || []
        };
        
        // Atualizar o estado primeiro, depois salvar
        setApiConnection(validatedConnection);
        saveApiConnection(validatedConnection);
        
        console.log('🎉 [EVOLUTION_API_SETTINGS] Validação completa!', validatedConnection.instances.length, 'instâncias encontradas');
        
        toast({
          title: "Sucesso",
          description: `API validada! ${validatedConnection.instances.length} instâncias encontradas.`,
        });
      } else {
        console.error('❌ [EVOLUTION_API_SETTINGS] Falha na validação:', result.error);
        throw new Error(result.error || 'Erro ao validar API');
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SETTINGS] Erro ao validar API:', error);
      toast({
        title: "Erro",
        description: `Falha ao conectar: ${error}`,
        variant: "destructive"
      });
    } finally {
      setValidatingApi(false);
    }
  };

  // SEÇÃO 2: Criar Nova Instância
  const createNewInstance = async () => {
    if (!apiConnection.isValidated) {
      toast({
        title: "Erro",
        description: "Valide a API primeiro",
        variant: "destructive"
      });
      return;
    }

    if (!newInstanceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
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

      const result = await service.createInstance(newInstanceName);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Instância '${newInstanceName}' criada com sucesso!`,
        });

        // Recarregar instâncias
        console.log('📋 [EVOLUTION_API_SETTINGS] Recarregando instâncias após criação...');
        await loadInstances(apiConnection.baseUrl, apiConnection.apiKey);
        setNewInstanceName('');
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
          description: `Instância '${instanceName}' excluída com sucesso!`,
        });

        // Recarregar instâncias
        console.log('📋 [EVOLUTION_API_SETTINGS] Recarregando instâncias após exclusão...');
        await loadInstances(apiConnection.baseUrl, apiConnection.apiKey);
      } else {
        throw new Error(result.error || 'Erro ao excluir instância');
      }
    } catch (error) {
      console.error('Erro ao excluir instância:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir instância: ${error}`,
        variant: "destructive"
      });
    } finally {
      setDeletingInstance(null);
    }
  };

  // SEÇÃO 3: Vincular Canal à Instância
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
      const selectedInstance = apiConnection.instances.find(i => i.instanceName === selectedInstanceForMapping);
      
      if (!selectedChannel || !selectedInstance) {
        throw new Error('Canal ou instância não encontrados');
      }

      // Configurar WebSocket na instância
      const service = new EvolutionApiService({
        baseUrl: apiConnection.baseUrl,
        apiKey: apiConnection.apiKey,
        instanceName: selectedInstance.instanceName
      });

      const configResult = await service.configureWebSocket(selectedInstance.instanceName);
      if (!configResult.success) {
        throw new Error(configResult.error || 'Erro ao configurar WebSocket');
      }

      // Criar mapeamento no banco
      await channelMappingService.createMapping({
        channel_id: selectedChannel.id,
        channel_name: selectedChannel.name,
        instance_id: selectedInstance.instanceName,
        instance_name: selectedInstance.instanceName,
        base_url: apiConnection.baseUrl,
        api_key: apiConnection.apiKey,
        is_active: true
      });

      toast({
        title: "Sucesso",
        description: `Canal '${selectedChannel.name}' vinculado à instância '${selectedInstance.instanceName}' com WebSocket ativo!`,
      });

      // Recarregar mapeamentos
      await loadChannelMappings();
      
      // Limpar seleções
      setSelectedChannelForMapping('');
      setSelectedInstanceForMapping('');
    } catch (error) {
      console.error('Erro ao vincular canal:', error);
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
      const mapping = channelMappings.find(m => m.id === mappingId);
      if (mapping) {
        // Desconectar WebSocket
        evolutionWebSocketManager.removeConnection(mapping.channelId);
      }

      await channelMappingService.deleteMapping(mappingId);
      
      toast({
        title: "Sucesso",
        description: "Canal desvinculado com sucesso!",
      });

      await loadChannelMappings();
    } catch (error) {
      console.error('Erro ao desvincular canal:', error);
      toast({
        title: "Erro",
        description: `Erro ao desvincular canal: ${error}`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { color: 'bg-green-500', text: 'Conectado', icon: Wifi },
      'close': { color: 'bg-red-500', text: 'Desconectado', icon: WifiOff },
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
    <>
      <div className="space-y-8">
        {/* SEÇÃO 1: Conectar API Evolution */}
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
              Configure a URL e API Key para conectar com a Evolution API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseUrl">URL Base da API</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://evolution.estudioonmp.com"
                  value={apiConnection.baseUrl}
                  onChange={(e) => setApiConnection(prev => ({
                    ...prev,
                    baseUrl: e.target.value,
                    isValidated: false
                  }))}
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
                  onChange={(e) => setApiConnection(prev => ({
                    ...prev,
                    apiKey: e.target.value,
                    isValidated: false
                  }))}
                  disabled={validatingApi}
                  className={cn(
                    isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                  )}
                />
              </div>
            </div>
            <Button
              onClick={validateApi}
              disabled={validatingApi}
              variant={apiConnection.isValidated ? "default" : "default"}
              className={cn(
                "w-full",
                isDarkMode ? "text-white" : "text-white"
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
                  API Validada
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Validar API
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
                <Settings className="w-5 h-5" />
                Gerenciar Instâncias
              </CardTitle>
              <CardDescription>
                Crie novas instâncias ou visualize as existentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  onClick={createNewInstance}
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

              <div className="space-y-2">
                <Label>Instâncias Existentes:</Label>
                {apiConnection.instances.length === 0 ? (
                  <p className="text-gray-500">Nenhuma instância encontrada.</p>
                ) : (
                  apiConnection.instances.map((instance) => {
                    console.log('🔍 [EVOLUTION_API_SETTINGS] Renderizando instância:', instance);
                    return (
                      <div
                        key={instance.instanceName}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-md",
                          isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusBadge(instance.status)}
                          <span className="font-semibold">{instance.profileName || instance.instanceName}</span>
                          {instance.number && (
                            <span className="text-sm text-gray-500">({instance.number})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(instance.status === 'connecting' || instance.status === 'close' || instance.status === 'unknown') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setQrCodeModal({
                                  isOpen: true,
                                  qrCode: '',
                                  instanceName: instance.instanceName,
                                  loading: true
                                });
                                
                                try {
                                  const service = new EvolutionApiService({
                                    baseUrl: apiConnection.baseUrl,
                                    apiKey: apiConnection.apiKey,
                                    instanceName: instance.instanceName
                                  });
                                  
                                  const qrResult = await service.getQRCodeForInstance(instance.instanceName);
                                  if (qrResult.success && qrResult.qrCode) {
                                    // Verificar se o QR Code já tem o prefixo data:image
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
                              Ver QR Code
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteInstance(instance.instanceName)}
                            disabled={deletingInstance === instance.instanceName}
                          >
                            {deletingInstance === instance.instanceName ? (
                              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                          {instance.profileName || instance.instanceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={linkChannelToInstance}
                disabled={linkingChannel || !selectedChannelForMapping || !selectedInstanceForMapping}
                className={cn(
                  "w-full bg-green-600 hover:bg-green-700 text-white",
                  (linkingChannel || !selectedChannelForMapping || !selectedInstanceForMapping) && "bg-gray-400 hover:bg-gray-400"
                )}
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

              <div className="space-y-2">
                <Label>Canais Vinculados:</Label>
                {channelMappings.length === 0 ? (
                  <p className="text-gray-500">Nenhum canal vinculado.</p>
                ) : (
                  channelMappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-md",
                        isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {getStatusBadge(mapping.isActive ? 'open' : 'close')}
                        <span className="font-semibold">{mapping.channelName}</span>
                        <span className="text-sm text-gray-500">({mapping.instanceName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkChannel(mapping.id)}
                          className={cn(
                            isDarkMode ? "border-[#3f3f46] text-white" : "border-gray-300 text-gray-700"
                          )}
                        >
                          <Unlink className="mr-2 h-4 w-4" />
                          Desvincular
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
    </>
  );
};
