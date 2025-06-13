
import { useState, useEffect } from 'react';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider, AIProviderFormData } from '@/types/ai-providers';

export const useAIProviders = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await AIProviderService.getProviders();
      setProviders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const createProvider = async (formData: AIProviderFormData) => {
    try {
      await AIProviderService.createProvider(formData);
      await loadProviders();
    } catch (error) {
      throw error;
    }
  };

  const updateProvider = async (id: string, formData: AIProviderFormData) => {
    try {
      await AIProviderService.updateProvider(id, formData);
      await loadProviders();
    } catch (error) {
      throw error;
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      await AIProviderService.deleteProvider(id);
      await loadProviders();
    } catch (error) {
      throw error;
    }
  };

  const testProvider = async (formData: AIProviderFormData) => {
    try {
      const result = await AIProviderService.testProvider('test');
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    providers,
    loading,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    refreshProviders: loadProviders
  };
};
