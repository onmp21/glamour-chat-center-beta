
import { useState, useEffect, useCallback } from 'react';
import { ChannelApiMapping } from '../types/domain/api/ChannelApiMapping';
import { ChannelApiMappingService } from '../services/ChannelApiMappingService';
import { ApiInstance } from '../services/ChannelApiMappingService';

export function useChannelApiMappings() {
  const [mappings, setMappings] = useState<ChannelApiMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const channelApiMappingService = new ChannelApiMappingService();

  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await channelApiMappingService.getAllMappings();
      setMappings(data);
    } catch (err) {
      console.error('Error fetching channel API mappings:', err);
      setError('Falha ao carregar mapeamentos de canais e APIs');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMappingByChannelId = useCallback(async (channelId: string): Promise<ChannelApiMapping | null> => {
    try {
      setError(null);
      return await channelApiMappingService.getMappingByChannelId(channelId);
    } catch (err) {
      console.error(`Error getting mapping for channel ${channelId}:`, err);
      setError('Falha ao obter mapeamento para o canal');
      return null;
    }
  }, []);

  const getApiInstanceForChannel = useCallback(async (channelId: string): Promise<ApiInstance | null> => {
    try {
      setError(null);
      return await channelApiMappingService.getApiInstanceForChannel(channelId);
    } catch (err) {
      console.error(`Error getting API instance for channel ${channelId}:`, err);
      setError('Falha ao obter instância da API para o canal');
      return null;
    }
  }, []);

  const upsertMapping = useCallback(async (channelId: string, apiInstanceId: string): Promise<ChannelApiMapping | null> => {
    try {
      setError(null);
      const result = await channelApiMappingService.upsertMapping(channelId, apiInstanceId);
      await fetchMappings(); // Refresh mappings after update
      return result;
    } catch (err) {
      console.error(`Error updating mapping for channel ${channelId}:`, err);
      setError('Falha ao atualizar mapeamento para o canal');
      return null;
    }
  }, [fetchMappings]);

  const deleteMapping = useCallback(async (channelId: string): Promise<void> => {
    try {
      setError(null);
      await channelApiMappingService.deleteMappingByChannelId(channelId);
      await fetchMappings(); // Refresh mappings after delete
    } catch (err) {
      console.error(`Error deleting mapping for channel ${channelId}:`, err);
      setError('Falha ao excluir mapeamento para o canal');
    }
  }, [fetchMappings]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  return {
    mappings,
    loading,
    error,
    fetchMappings,
    getMappingByChannelId,
    getApiInstanceForChannel,
    upsertMapping,
    deleteMapping
  };
}
