import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Plus, Wifi, WifiOff, Settings, Trash2, Eye, EyeOff, Copy, QrCode } from 'lucide-react';
import { EvolutionApiService, InstanceInfo } from '@/services/EvolutionApiService';

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
        return 'Aguardando QR';
      case 'close':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'open':
        return <Wifi size={16} className="text-green-500" />;
      case 'connecting':
      case 'qr':
        return <Settings size={16} className="text-yellow-500 animate-spin" />;
      case 'close':
        return <WifiOff size={16} className="text-red-500" />;
      default:
        return <WifiOff size={16} className="text-gray-500" />;
    }
  };

  const handleInstanceSelect = async (instanceName: string) => {
    setSelectedInstance(instanceName);
    onInstanceSelect?.(instanceName);
    
    // Configurar webhook automaticamente ao selecionar a instância
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        instanceName: instanceName
      });
      
      // URL do webhook para onde os eventos serão enviados
      const webhookUrl = `${window.location.protocol}//${window.location.hostname}:3000/webhook`;
      
      // Lista de eventos que queremos receber
      const events = [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'MESSAGES_SET',
        'CONTACTS_UPSERT',
        'CHATS_UPSERT'
      ];
      
      console.log('🔗 [INSTANCE_MANAGER] Configurando webhook automaticamente:', webhookUrl);
      
      const result = await service.setWebhook(webhookUrl, events, instanceName);
      
      if (result.success) {
        toast({
          title: "Webhook configurado",
          description: `Webhook configurado automaticamente para a instância ${instanceName}`,
        });
      } else {
        throw new Error(result.error || 'Erro ao configurar webhook');
      }
    } catch (error) {
      console.error('❌ [INSTANCE_MANAGER] Erro ao configurar webhook:', error);
      toast({
        title: "Aviso",
        description: `A instância foi selecionada, mas houve um erro ao configurar o webhook: ${error}`,
        variant: "destructive"
      });
    }
    
    toast({
      title: "Instância selecionada",
      description: `Instância ${instanceName} foi selecionada para este canal`,
    });
  };

  const deleteInstance = async (instanceName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a instância ${instanceName}?`)) {
      return;
    }

    try {
      const service = new EvolutionApiService({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        instanceName: instanceName
      });

      const result = await service.deleteInstance(instanceName);
      
      if (result.success) {
        toast({
          title: "Instância deletada",
          description: `Instância ${instanceName} foi deletada com sucesso`,
        });
        
        await loadInstances();
      } else {
        throw new Error(result.error || 'Erro ao deletar instância');
      }
    } catch (error) {
      console.error('❌ [INSTANCE_MANAGER] Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: `Erro ao deletar instância: ${error}`,
        variant: "destructive"
      });
    }
  };

  const showQRCode = async (instanceName: string) => {
    try {
      const service = new EvolutionApiService({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        instanceName: instanceName
      });

      const result = await service.getQRCodeForInstance(instanceName);
      
      if (result.success && result.qrCode) {
        setQrCodeModal({ instanceName, qrCode: result.qrCode });
      } else {
        throw new Error(result.error || 'Erro ao obter QR Code');
      }
    } catch (error) {
      console.error('❌ [INSTANCE_MANAGER] Erro ao obter QR Code:', error);
      toast({
        title: "Erro",
        description: `Erro ao obter QR Code: ${error}`,
        variant: "destructive"
      });
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiConfig.apiKey);
    toast({
      title: "API Key copiada",
      description: "A API Key foi copiada para a área de transferência",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header com informações da API */}
      <Card className={cn(
        isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Configuração da Evolution API</CardTitle>
              <CardDescription>
                URL: {apiConfig.baseUrl || 'Não configurada'}
              </CardDescription>
            </div>
            <Button
              onClick={loadInstances}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">API Key:</span>
            <code className={cn(
              "px-2 py-1 rounded text-xs font-mono",
              isDarkMode ? "bg-secondary" : "bg-gray-100"
            )}>
              {showApiKey ? apiConfig.apiKey : '••••••••••••••••'}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyApiKey}
            >
              <Copy size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header da lista de instâncias */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Instâncias Disponíveis</h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-muted-foreground" : "text-gray-600"
          )}>
            Clique em uma instância para vinculá-la a este canal
          </p>
        </div>
      </div>

      {/* Lista de Instâncias em Cards */}
      {instances.length === 0 ? (
        <Card className={cn(
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h4 className="font-medium mb-2">Nenhuma instância encontrada</h4>
            <p className={cn(
              "text-sm mb-4",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              {loading ? "Carregando instâncias..." : "Não há instâncias disponíveis na Evolution API"}
            </p>
            {!loading && (
              <Button onClick={loadInstances} variant="outline">
                <RefreshCw size={16} />
                Tentar novamente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {instances.map((instance) => (
            <Card
              key={instance.instanceName}
              className={cn(
                "transition-all duration-200 hover:shadow-lg cursor-pointer border-2",
                isDarkMode ? "bg-card border-border hover:border-accent" : "bg-white border-gray-200 hover:border-gray-300",
                selectedInstance === instance.instanceName && "ring-2 ring-primary border-primary"
              )}
              onClick={() => handleInstanceSelect(instance.instanceName)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(instance.status)}
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      getStatusColor(instance.status)
                    )} />
                  </div>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      instance.status === 'open' && "border-green-500 text-green-600",
                      instance.status === 'connecting' && "border-yellow-500 text-yellow-600",
                      instance.status === 'close' && "border-destructive text-destructive"
                    )}
                  >
                    {getStatusText(instance.status)}
                  </Badge>
                </div>
                <CardTitle className="text-base truncate">
                  {instance.instanceName}
                </CardTitle>
                {instance.profileName && (
                  <CardDescription className="truncate">
                    {instance.profileName}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                {instance.number && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">Número:</span>
                    <code className={cn(
                      "text-xs px-1 py-0.5 rounded",
                      isDarkMode ? "bg-secondary" : "bg-gray-100"
                    )}>
                      {instance.number}
                    </code>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {instance.status !== 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        showQRCode(instance.instanceName);
                      }}
                      className="flex-1"
                    >
                      <QrCode size={14} />
                      QR Code
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInstance(instance.instanceName);
                    }}
                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instância selecionada */}
      {selectedInstance && (
        <Card className={cn(
          "border-primary bg-card dark:border-primary dark:bg-card"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm font-medium">
                Instância vinculada: {selectedInstance}
              </span>
            </div>
            <p className="text-xs text-primary mt-1">
              Esta instância será usada para enviar e receber mensagens neste canal
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do QR Code */}
      {qrCodeModal && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className={cn(
            "p-6 rounded-lg shadow-lg max-w-md w-full mx-4",
            isDarkMode ? "bg-card" : "bg-white"
          )}>
            <h3 className="text-lg font-medium mb-4 text-center">
              Conectar {qrCodeModal.instanceName}
            </h3>
            
            <div className="text-center">
              <p className="mb-4 text-sm">
                Escaneie o QR Code abaixo com o WhatsApp para conectar esta instância:
              </p>
              <div className="mb-4 flex justify-center">
                <img 
                  src={`data:image/png;base64,${qrCodeModal.qrCode}`} 
                  alt="QR Code" 
                  className="w-64 h-64 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setQrCodeModal(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => showQRCode(qrCodeModal.instanceName)}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw size={16} />
                  Atualizar QR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
