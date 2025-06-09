
import { useState, useEffect, useMemo } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { OptimizedContactService, OptimizedContact } from '@/services/OptimizedContactService';

export const useContactsOptimized = () => {
  const [contacts, setContacts] = useState<OptimizedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  // Memoizar mapeamento de canais para evitar recálculos
  const channelMapping = useMemo(() => ({
    'Yelena-AI': 'chat',
    'Canarana': 'canarana',
    'Souto Soares': 'souto-soares',
    'João Dourado': 'joao-dourado',
    'América Dourada': 'america-dourada',
    'Gustavo Gerente das Lojas': 'gerente-lojas',
    'Andressa Gerente Externo': 'gerente-externo'
  }), []);

  // Memoizar canais ativos para evitar recálculos
  const activeChannelIds = useMemo(() => {
    const accessibleChannels = getAccessibleChannels();
    return channels
      .filter(c => c.isActive)
      .map(c => channelMapping[c.name as keyof typeof channelMapping])
      .filter(id => id && accessibleChannels.includes(id));
  }, [channels, getAccessibleChannels, channelMapping]);

  const loadContacts = async () => {
    if (activeChannelIds.length === 0) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(10);
    
    try {
      setLoadingProgress(30);
      
      // Usar o serviço otimizado que já tem cache
      const optimizedContacts = await OptimizedContactService.getContactsForChannels(activeChannelIds);
      
      setLoadingProgress(80);
      setContacts(optimizedContacts);
      setLoadingProgress(100);
      
    } catch (err) {
      console.error('❌ [CONTACTS_OPTIMIZED] Error loading contacts:', err);
      setError('Erro ao carregar contatos');
      setContacts([]);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  };

  // Carregar apenas quando houver canais
  useEffect(() => {
    if (activeChannelIds.length > 0) {
      loadContacts();
    } else {
      setContacts([]);
      setLoading(false);
    }
  }, [activeChannelIds]);

  const refetch = () => {
    OptimizedContactService.clearCache();
    loadContacts();
  };

  return { 
    contacts, 
    loading, 
    error, 
    loadingProgress,
    refetch,
    hasChannels: activeChannelIds.length > 0
  };
};
