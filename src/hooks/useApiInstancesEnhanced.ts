
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ApiInstance, ApiInstanceWithConnection } from '@/types/domain/api/ApiInstance';

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
  const [instances, setInstances] = useState<ApiInstanceWithConnection[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  // Cache para evitar múltiplas requisições
  const [lastFetch, setLastFetch] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  const fetchInstances = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < CACHE_DURATION) {
      console.log('🔄 [API_INSTANCES] Using cached data');
      return;
    }

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
      const formattedInstances: ApiInstanceWithConnection[] = (data || []).map(instance => ({
        ...instance,
        created_at: instance.created_at || new Date().toISOString(),
      }));
      
      setInstances(formattedInstances);
      setLastFetch(now);
      
      // Resetar instâncias do Evolution antes de buscar novas
      setEvolutionInstances([]);
      
      if (formattedInstances && formattedInstances.length > 0) {
        await fetchEvolutionInstances(formattedInstances);
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
  }, [lastFetch]);

  // Memoizar função de fetch das instâncias Evolution
  const fetchEvolutionInstances = useMemo(() => 
    async (apiInstances: ApiInstance[]) => {
      console.log('🔄 [EVOLUTION_INSTANCES] Buscando instâncias do Evolution API...');
      
      const allEvolutionInstances: EvolutionInstance[] = [];
      
      // Limitar processamento paralelo para evitar sobrecarga
      const MAX_CONCURRENT = 3;
      for (let i = 0; i < apiInstances.length; i += MAX_CONCURRENT) {
        const batch = apiInstances.slice(i, i + MAX_CONCURRENT);
        
        const batchPromises = batch.map(async (apiInstance) => {
          try {
            console.log(`📡 [EVOLUTION_INSTANCES] Verificando: ${apiInstance.base_url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduzir timeout
            
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
              console.error(`❌ [EVOLUTION_INSTANCES] HTTP ${response.status} para ${apiInstance.base_url}`);
              return [];
            }

            const data = await response.json();
            console.log(`✅ [EVOLUTION_INSTANCES] Dados de ${apiInstance.base_url}:`, data);
            
            if (Array.isArray(data)) {
              return data.map((item: any) => ({
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
            }
            
            return [];
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.error(`⏱️ [EVOLUTION_INSTANCES] Timeout: ${apiInstance.base_url}`);
            } else {
              console.error(`❌ [EVOLUTION_INSTANCES] Erro: ${apiInstance.base_url}:`, error);
            }
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allEvolutionInstances.push(...batchResults.flat());
      }
      
      console.log('✅ [EVOLUTION_INSTANCES] Total encontradas:', allEvolutionInstances.length);
      setEvolutionInstances(allEvolutionInstances);
    }, []
  );

  const checkConnectionStatus = useCallback(async (instance: ApiInstanceWithConnection) => {
    console.log('🔍 [API_INSTANCES] Verificando status:', instance.instance_name);
    setCheckingStatus(instance.id);
    
    try {
      const { ApiInstanceService } = await import("@/services/ApiInstanceService");
      const service = new ApiInstanceService();

      const connectionDetails = await service.getInstanceWithConnectionDetails(instance.id);
      console.log("📡 [API_INSTANCES] Detalhes recebidos:", connectionDetails);
      
      setInstances(prev => prev.map(inst => 
        inst.id === instance.id 
          ? { ...inst, connection_status: connectionDetails?.connection_status, qr_code: connectionDetails?.qr_code || null }
          : inst
      ));

      toast({
        title: "Status Verificado",
        description: `Instância ${instance.instance_name}: ${connectionDetails?.connection_status === 'connected' ? 'Conectada' : connectionDetails?.connection_status === 'connecting' ? 'Conectando' : 'Desconectada'}`,
        variant: connectionDetails?.connection_status === 'connected' ? "default" : "destructive"
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
  }, []);

  const deleteInstance = useCallback(async (instance: ApiInstanceWithConnection) => {
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

      fetchInstances(true); // Force refresh
    } catch (error) {
      console.error('❌ [API_INSTANCES] Erro inesperado ao deletar:', error);
    }
  }, [fetchInstances]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    evolutionInstances,
    loading,
    checkingStatus,
    fetchInstances: () => fetchInstances(true),
    checkConnectionStatus,
    deleteInstance
  };
};
