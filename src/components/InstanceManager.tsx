import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Plus, Wifi, WifiOff, Settings, Trash2 } from 'lucide-react';
import { EvolutionApiService } from '@/services/EvolutionApiService';

interface Instance {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting' | 'qr';
  };
  webhook?: {
    url?: string;
    enabled?: boolean;
  };
}

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
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);

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
        instanceName: 'temp' // Temporário para listagem
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

  const handleInstanceSelect = (instanceName: string) => {
    setSelectedInstance(instanceName);
    onInstanceSelect?.(instanceName);
    
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

      const result = await service.deleteInstance();
      
      if (result.success) {
        toast({
          title: "Instância deletada",
          description: `Instância ${instanceName} foi deletada com sucesso`,
        });
        
        // Recarregar lista
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Instâncias</h3>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Visualize e gerencie instâncias existentes da Evolution API
          </p>
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

      {/* Lista de Instâncias */}
      {instances.length === 0 ? (
        <Card className={cn(
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h4 className="font-medium mb-2">Nenhuma instância encontrada</h4>
            <p className={cn(
              "text-sm mb-4",
              isDarkMode ? "text-gray-400" : "text-gray-600"
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
        <div className="grid gap-3">
          {instances.map((instance) => (
            <Card
              key={instance.instance.instanceName}
              className={cn(
                "transition-all duration-200 hover:shadow-md cursor-pointer",
                isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200",
                selectedInstance === instance.instance.instanceName && "ring-2 ring-blue-500"
              )}
              onClick={() => handleInstanceSelect(instance.instance.instanceName)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(instance.instance.state)}
                    
                    <div>
                      <h4 className="font-medium">{instance.instance.instanceName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          getStatusColor(instance.instance.state)
                        )} />
                        <span className={cn(
                          "text-xs",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {getStatusText(instance.instance.state)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getStatusText(instance.instance.state)}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteInstance(instance.instance.instanceName);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {instance.webhook?.url && (
                  <div className={cn(
                    "mt-3 p-2 rounded text-xs",
                    isDarkMode ? "bg-gray-800" : "bg-gray-50"
                  )}>
                    <span className="font-medium">Webhook: </span>
                    <span className={cn(
                      "font-mono",
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    )}>
                      {instance.webhook.url}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedInstance && (
        <Card className={cn(
          "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium">
                Instância selecionada: {selectedInstance}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Esta instância será usada para enviar mensagens neste canal
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

