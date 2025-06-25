
import { useState, useEffect, useCallback } from 'react';
import { ApiInstance, ApiInstanceWithConnection } from '../types/domain/api/ApiInstance';
import { ApiInstanceRepository } from '../repositories/ApiInstanceRepository';
import { ApiInstanceService } from '../services/ApiInstanceService';

export function useApiInstances() {
  const [instances, setInstances] = useState<ApiInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const apiInstanceRepository = new ApiInstanceRepository();
  const apiInstanceService = new ApiInstanceService();

  const fetchInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching API instances...');
      const data = await apiInstanceRepository.getAll();
      console.log('✅ API instances fetched:', data);
      setInstances(data);
    } catch (err) {
      console.error('❌ Error fetching API instances:', err);
      setError('Falha ao carregar instâncias da API');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInstance = useCallback(async (instanceData: Omit<ApiInstance, 'id' | 'created_at' | 'updated_at'>): Promise<ApiInstance | null> => {
    try {
      setError(null);
      console.log('🚀 Creating new API instance:', instanceData);
      const newInstance = await apiInstanceRepository.create(instanceData as ApiInstance);
      console.log('✅ API instance created:', newInstance);
      
      // Immediately refresh instances after creation
      await fetchInstances();
      return newInstance;
    } catch (err) {
      console.error('❌ Error creating API instance:', err);
      setError('Falha ao criar instância da API');
      return null;
    }
  }, [fetchInstances]);

  const updateInstance = useCallback(async (id: string, instanceData: Partial<ApiInstance>): Promise<ApiInstance | null> => {
    try {
      setError(null);
      console.log('🔄 Updating API instance:', id, instanceData);
      const updatedInstance = await apiInstanceRepository.update(id, instanceData);
      console.log('✅ API instance updated:', updatedInstance);
      await fetchInstances();
      return updatedInstance;
    } catch (err) {
      console.error(`❌ Error updating API instance ${id}:`, err);
      setError('Falha ao atualizar instância da API');
      return null;
    }
  }, [fetchInstances]);

  const deleteInstance = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ Deleting API instance:', id);
      await apiInstanceRepository.delete(id);
      console.log('✅ API instance deleted');
      await fetchInstances();
    } catch (err) {
      console.error(`❌ Error deleting API instance ${id}:`, err);
      setError('Falha ao excluir instância da API');
    }
  }, [fetchInstances]);

  const getInstanceById = useCallback(async (id: string): Promise<ApiInstance | null> => {
    try {
      setError(null);
      return await apiInstanceRepository.getById(id);
    } catch (err) {
      console.error(`❌ Error getting API instance ${id}:`, err);
      setError('Falha ao obter instância da API');
      return null;
    }
  }, []);

  const getInstanceWithConnectionDetails = useCallback(async (id: string): Promise<ApiInstanceWithConnection | null> => {
    try {
      setError(null);
      return await apiInstanceService.getInstanceWithConnectionDetails(id);
    } catch (err) {
      console.error(`❌ Error getting instance connection details ${id}:`, err);
      setError('Falha ao obter detalhes de conexão da instância');
      return null;
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    loading,
    error,
    fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    getInstanceById,
    getInstanceWithConnectionDetails
  };
}
