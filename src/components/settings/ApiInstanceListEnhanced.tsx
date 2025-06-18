
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, QrCode, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeleteInstanceModal } from '@/components/modals/DeleteInstanceModal';
import { QRCodeManager } from '@/components/QRCodeManager';
import { cn } from '@/lib/utils';

interface ApiInstance {
  id: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at: string;
  connection_status?: 'connected' | 'disconnected' | 'connecting';
}

interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  status: string;
  serverUrl: string;
  apikey: string;
}

interface ApiInstanceListEnhancedProps {
  isDarkMode?: boolean;
}

export const ApiInstanceListEnhanced: React.FC<ApiInstanceListEnhancedProps> = ({ isDarkMode = false }) => {
  const [instances, setInstances] = useState<ApiInstance[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; instance?: ApiInstance }>({ isOpen: false });
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; channelId?: string }>({ isOpen: false });
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  const fetchInstances = async () => {
    console.log('🔄 [API_INSTANCES] Carregando instâncias...');
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('api_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [API_INSTANCES] Erro ao carregar instâncias:', error);
        console.error('❌ [API_INSTANCES] Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "Erro",
          description: "Erro ao carregar instâncias da API: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [API_INSTANCES] Instâncias carregadas:', data?.length || 0);
      console.log('📊 [API_INSTANCES] Dados completos:', JSON.stringify(data, null, 2));
      
      if (!data || data.length === 0) {
        console.log('⚠️ [API_INSTANCES] Nenhuma instância encontrada na tabela api_instances');
      }
      
      setInstances(data || []);
      
      // Buscar instâncias do Evolution API
      await fetchEvolutionInstances(data || []);
    } catch (error) {
      console.error('❌ [API_INSTANCES] Erro inesperado ao carregar:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar instâncias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvolutionInstances = async (apiInstances: ApiInstance[]) => {
    console.log('🔄 [EVOLUTION_INSTANCES] Buscando instâncias do Evolution API...');
    
    for (const apiInstance of apiInstances) {
      try {
        console.log(`📡 [EVOLUTION_INSTANCES] Verificando instâncias para: ${apiInstance.base_url}`);
        
        const response = await fetch(`${apiInstance.base_url}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': apiInstance.api_key,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`❌ [EVOLUTION_INSTANCES] Erro HTTP ${response.status} para ${apiInstance.base_url}`);
          continue;
        }

        const data = await response.json();
        console.log(`✅ [EVOLUTION_INSTANCES] Instâncias recebidas de ${apiInstance.base_url}:`, data);
        
        if (Array.isArray(data)) {
          const formattedInstances = data.map((item: any) => ({
            ...item.instance,
            apiInstanceId: apiInstance.id
          }));
          
          setEvolutionInstances(prev => [...prev, ...formattedInstances]);
        }
      } catch (error) {
        console.error(`❌ [EVOLUTION_INSTANCES] Erro ao buscar instâncias de ${apiInstance.base_url}:`, error);
      }
    }
  };

  const checkConnectionStatus = async (instance: ApiInstance) => {
    console.log('🔍 [API_INSTANCES] Verificando status da instância:', instance.instance_name);
    setCheckingStatus(instance.id);
    
    try {
      const { EvolutionApiService } = await import('@/services/EvolutionApiService');
      const service = new EvolutionApiService({
        baseUrl: instance.base_url,
        apiKey: instance.api_key,
        instanceName: instance.instance_name
      });

      const result = await service.getConnectionStatus();
      console.log('📡 [API_INSTANCES] Status recebido:', result);
      
      // Atualizar status local
      setInstances(prev => prev.map(inst => 
        inst.id === instance.id 
          ? { ...inst, connection_status: result.connected ? 'connected' : 'disconnected' }
          : inst
      ));

      toast({
        title: "Status Verificado",
        description: `Instância ${instance.instance_name}: ${result.connected ? 'Conectada' : 'Desconectada'}`,
        variant: result.connected ? "default" : "destructive"
      });
    } catch (error) {
      console.error('❌ [API_INSTANCES] Erro ao verificar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar status da instância",
        variant: "destructive"
      });
    } finally {
      setCheckingStatus(null);
    }
  };

  const deleteInstance = async (instance: ApiInstance) => {
    console.log('🗑️ [API_INSTANCES] Deletando instância:', instance.instance_name);
    
    try {
      const { error } = await supabase
        .from('api_instances')
        .delete()
        .eq('id', instance.id);

      if (error) {
        console.error('❌ [API_INSTANCES] Erro ao deletar:', error);
        toast({
          title: "Erro",
          description: "Erro ao deletar instância",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [API_INSTANCES] Instância deletada com sucesso');
      toast({
        title: "Sucesso",
        description: "Instância deletada com sucesso",
      });

      fetchInstances();
    } catch (error) {
      console.error('❌ [API_INSTANCES] Erro inesperado ao deletar:', error);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  if (loading) {
    return (
      <div className={cn("p-6", isDarkMode ? "text-white" : "text-gray-900")}>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando instâncias...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
          Instâncias Cadastradas ({instances.length})
        </h3>
        <Button onClick={fetchInstances} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {evolutionInstances.length > 0 && (
        <div className="space-y-4">
          <h4 className={cn("text-md font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
            Instâncias do Evolution API ({evolutionInstances.length})
          </h4>
          
          <div className="grid gap-4">
            {evolutionInstances.map((evolutionInstance, index) => (
              <Card key={`${evolutionInstance.instanceId}-${index}`} className={cn(
                "transition-all duration-200",
                isDarkMode ? "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]" : "bg-white border-gray-200 hover:border-gray-300"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn("text-base", isDarkMode ? "text-white" : "text-gray-900")}>
                      {evolutionInstance.instanceName}
                    </CardTitle>
                    <Badge variant={evolutionInstance.status === 'open' ? 'default' : 'destructive'}>
                      {evolutionInstance.status === 'open' ? (
                        <Wifi className="h-3 w-3 mr-1" />
                      ) : (
                        <WifiOff className="h-3 w-3 mr-1" />
                      )}
                      {evolutionInstance.status === 'open' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div>
                      <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                        ID da Instância:
                      </span>
                      <p className={cn("text-sm font-mono", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                        {evolutionInstance.instanceId}
                      </p>
                    </div>
                    {evolutionInstance.profileName && (
                      <div>
                        <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                          Nome do Perfil:
                        </span>
                        <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                          {evolutionInstance.profileName}
                        </p>
                      </div>
                    )}
                    {evolutionInstance.owner && (
                      <div>
                        <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                          Proprietário:
                        </span>
                        <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                          {evolutionInstance.owner}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {instances.length === 0 ? (
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200")}>
          <CardContent className="py-8">
            <div className={cn("text-center", isDarkMode ? "text-zinc-400" : "text-gray-500")}>
              <p>Nenhuma instância cadastrada</p>
              <p className="text-sm mt-1">Adicione uma nova instância para começar</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <h4 className={cn("text-md font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
            Configurações da API ({instances.length})
          </h4>
          {instances.map((instance) => (
            <Card key={instance.id} className={cn(
              "transition-all duration-200",
              isDarkMode ? "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]" : "bg-white border-gray-200 hover:border-gray-300"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-base", isDarkMode ? "text-white" : "text-gray-900")}>
                    {instance.instance_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {instance.connection_status && (
                      <Badge variant={instance.connection_status === 'connected' ? 'default' : 'destructive'}>
                        {instance.connection_status === 'connected' ? (
                          <Wifi className="h-3 w-3 mr-1" />
                        ) : (
                          <WifiOff className="h-3 w-3 mr-1" />
                        )}
                        {instance.connection_status === 'connected' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                      URL Base:
                    </span>
                    <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                      {instance.base_url}
                    </p>
                  </div>
                  <div>
                    <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                      API Key:
                    </span>
                    <p className={cn("text-sm font-mono", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                      {instance.api_key.substring(0, 10)}...
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => checkConnectionStatus(instance)}
                    disabled={checkingStatus === instance.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
                    )}
                  >
                    {checkingStatus === instance.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Verificar Status
                  </Button>
                  
                  <Button
                    onClick={() => setQrModal({ isOpen: true, channelId: instance.id })}
                    variant="outline"
                    size="sm"
                    className={cn(
                      isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
                    )}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                  
                  <Button
                    onClick={() => setDeleteModal({ isOpen: true, instance })}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      <DeleteInstanceModal
        isOpen={deleteModal.isOpen}
        instance={deleteModal.instance}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={() => {
          if (deleteModal.instance) {
            deleteInstance(deleteModal.instance);
          }
          setDeleteModal({ isOpen: false });
        }}
        isDarkMode={isDarkMode}
      />

      {qrModal.isOpen && qrModal.channelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn(
            "bg-white rounded-lg p-6 max-w-md w-full mx-4",
            isDarkMode ? "bg-[#18181b] border border-[#27272a]" : ""
          )}>
            <QRCodeManager
              isDarkMode={isDarkMode}
              channelId={qrModal.channelId}
            />
            <Button
              onClick={() => setQrModal({ isOpen: false })}
              variant="outline"
              className={cn(
                "w-full mt-4",
                isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
              )}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
