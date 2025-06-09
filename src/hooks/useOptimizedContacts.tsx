
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { OptimizedContactService, OptimizedContact } from '@/services/OptimizedContactService';

export const useOptimizedContacts = () => {
  const [contacts, setContacts] = useState<OptimizedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    try {
      const accessibleChannels = getAccessibleChannels();
      const channelMapping = {
        'Yelena-AI': 'chat',
        'Canarana': 'canarana',
        'Souto Soares': 'souto-soares',
        'João Dourado': 'joao-dourado',
        'América Dourada': 'america-dourada',
        'Gustavo Gerente das Lojas': 'gerente-lojas',
        'Andressa Gerente Externo': 'gerente-externo'
      };
      
      // Filtrar apenas canais ativos e acessíveis
      const activeChannelIds = channels
        .filter(c => c.isActive)
        .map(c => channelMapping[c.name as keyof typeof channelMapping])
        .filter(id => id && accessibleChannels.includes(id));
      
      if (activeChannelIds.length === 0) {
        setContacts([]);
        return;
      }
      
      setLoadingProgress(25);
      
      // Carregar contatos otimizados
      const optimizedContacts = await OptimizedContactService.getContactsForChannels(activeChannelIds);
      
      setLoadingProgress(100);
      setContacts(optimizedContacts);
      
    } catch (err) {
      console.error('❌ [OPTIMIZED_CONTACTS] Error loading contacts:', err);
      setError('Erro ao carregar contatos');
      setContacts([]);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      loadContacts();
    }
  }, [channels, getAccessibleChannels]);

  const refetch = () => {
    OptimizedContactService.clearCache();
    loadContacts();
  };

  return { 
    contacts, 
    loading, 
    error, 
    loadingProgress,
    refetch 
  };
};
