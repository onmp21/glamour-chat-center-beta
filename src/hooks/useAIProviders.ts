
import { useState, useEffect } from 'react';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider, AIProviderFormData } from '@/types/ai-providers';
import { useAuth } from '@/contexts/AuthContext'; // Usar contexto customizado

export const useAIProviders = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth(); // Pegar usuário do contexto customizado

  const loadProviders = async () => {
    try {
      console.log('📋 [USE_AI_PROVIDERS] Loading providers for user:', user?.id);
      setLoading(true);
      const data = await AIProviderService.getProviders();
      setProviders(data);
      setError('');
    } catch (err) {
      console.error('❌ [USE_AI_PROVIDERS] Error loading providers:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar provedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('🚀 [USE_AI_PROVIDERS] User authenticated, loading providers');
      loadProviders();
    } else {
      console.log('⏳ [USE_AI_PROVIDERS] No authenticated user, waiting...');
    }
  }, [user]);

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
      console.log('📝 [USE_AI_PROVIDERS] Creating provider for user:', user?.id);
      const result = await AIProviderService.createProvider(formData, user?.id);
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
      console.log('🔄 [USE_AI_PROVIDERS] Updating provider:', id, 'for user:', user?.id);
      const result = await AIProviderService.updateProvider(id, formData, user?.id);
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
      console.log('🗑️ [USE_AI_PROVIDERS] Deleting provider:', id, 'for user:', user?.id);
      await AIProviderService.deleteProvider(id, user?.id);
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
