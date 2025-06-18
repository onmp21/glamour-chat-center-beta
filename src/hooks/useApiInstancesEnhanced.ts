
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const useApiInstancesEnhanced = () => {
  const [instances, setInstances] = useState<ApiInstance[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
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
        toast({
          title: "Erro",
          description: "Erro ao carregar instâncias da API: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [API_INSTANCES] Instâncias carregadas:', data?.length || 0);
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

  return {
    instances,
    evolutionInstances,
    loading,
    checkingStatus,
    fetchInstances,
    checkConnectionStatus,
    deleteInstance
  };
};
