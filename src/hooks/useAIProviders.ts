
import { useState, useEffect } from 'react';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider, AIProviderFormData } from '@/types/ai-providers';

export const useAIProviders = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await AIProviderService.getProviders();
      setProviders(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar provedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const refreshProviders = async () => {
    try {
      setRefreshing(true);
      await loadProviders();
    } finally {
      setRefreshing(false);
    }
  };

  const createProvider = async (formData: AIProviderFormData) => {
    try {
      const result = await AIProviderService.createProvider(formData);
      if (result.success) {
        await loadProviders();
      }
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateProvider = async (id: string, formData: AIProviderFormData) => {
    try {
      const result = await AIProviderService.updateProvider(id, formData);
      if (result.success) {
        await loadProviders();
      }
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      await AIProviderService.deleteProvider(id);
      await loadProviders();
    } catch (err) {
      throw err;
    }
  };

  const testProvider = async (formData: AIProviderFormData) => {
    try {
      return await AIProviderService.testProvider('test');
    } catch (err) {
      throw err;
    }
  };

  return {
    providers,
    loading,
    refreshing,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    refreshProviders
  };
};
