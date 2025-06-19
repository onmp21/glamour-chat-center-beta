
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
  apiInstanceId?: string;
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
      
      // CORRIGIDO: Resetar sempre antes de buscar novas instâncias
      setEvolutionInstances([]);
      
      // Buscar instâncias do Evolution API com melhor tratamento de erro
      if (data && data.length > 0) {
        await fetchEvolutionInstances(data);
      }
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
    
    const allEvolutionInstances: EvolutionInstance[] = [];
    
    for (const apiInstance of apiInstances) {
      try {
        console.log(`📡 [EVOLUTION_INSTANCES] Verificando instâncias para: ${apiInstance.base_url}`);
        
        // CORRIGIDO: Adicionar timeout e melhor tratamento de erro
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`${apiInstance.base_url}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': apiInstance.api_key,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`❌ [EVOLUTION_INSTANCES] Erro HTTP ${response.status} para ${apiInstance.base_url}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        console.log(`✅ [EVOLUTION_INSTANCES] Instâncias recebidas de ${apiInstance.base_url}:`, data);
        
        if (Array.isArray(data)) {
          const formattedInstances = data.map((item: any) => ({
            instanceName: item.instance?.instanceName || item.instanceName || 'Sem nome',
            instanceId: item.instance?.instanceId || item.instanceId || '',
            owner: item.instance?.owner || item.owner,
            profileName: item.instance?.profileName || item.profileName,
            profilePictureUrl: item.instance?.profilePictureUrl || item.profilePictureUrl,
            profileStatus: item.instance?.profileStatus || item.profileStatus,
            status: item.instance?.status || item.status || 'unknown',
            serverUrl: item.instance?.serverUrl || apiInstance.base_url,
            apikey: item.instance?.apikey || apiInstance.api_key,
            apiInstanceId: apiInstance.id
          }));
          
          allEvolutionInstances.push(...formattedInstances);
          console.log(`📊 [EVOLUTION_INSTANCES] ${formattedInstances.length} instâncias processadas de ${apiInstance.base_url}`);
        } else {
          console.log(`⚠️ [EVOLUTION_INSTANCES] Resposta não é um array de ${apiInstance.base_url}:`, typeof data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`⏱️ [EVOLUTION_INSTANCES] Timeout ao buscar instâncias de ${apiInstance.base_url}`);
        } else {
          console.error(`❌ [EVOLUTION_INSTANCES] Erro ao buscar instâncias de ${apiInstance.base_url}:`, error);
        }
      }
    }
    
    console.log('✅ [EVOLUTION_INSTANCES] Total de instâncias encontradas:', allEvolutionInstances.length);
    setEvolutionInstances(allEvolutionInstances);
  };

  const checkConnectionStatus = async (instance: ApiInstance) => {
    console.log('🔍 [API_INSTANCES] Verificando status da instância:', instance.instance_name);
    setCheckingStatus(instance.id);
    
    try {
      // CORRIGIDO: Usar import dinâmico ao invés de require
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
