
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { OptimizedContactService, OptimizedContact } from '@/services/OptimizedContactService';

interface ContactCache {
  data: OptimizedContact[];
  timestamp: number;
  channelKey: string;
}

const CACHE_TTL = 60000; // 60 segundos
const DEBOUNCE_DELAY = 300; // 300ms

export const useUnifiedContacts = () => {
  const [contacts, setContacts] = useState<OptimizedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [cache, setCache] = useState<ContactCache | null>(null);
  
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

  // Memoizar canais ativos e acessíveis
  const activeChannelIds = useMemo(() => {
    const accessibleChannels = getAccessibleChannels();
    const channelIds = channels
      .filter(c => c.isActive)
      .map(c => channelMapping[c.name as keyof typeof channelMapping])
      .filter(id => id && accessibleChannels.includes(id));
    
    console.log('🔍 [UNIFIED_CONTACTS] Active channel IDs:', channelIds);
    return channelIds;
  }, [channels, getAccessibleChannels, channelMapping]);

  // Criar chave de cache baseada nos canais ativos
  const cacheKey = useMemo(() => {
    return activeChannelIds.sort().join('-');
  }, [activeChannelIds]);

  // Verificar se o cache ainda é válido
  const isCacheValid = useCallback(() => {
    if (!cache) return false;
    if (cache.channelKey !== cacheKey) return false;
    return Date.now() - cache.timestamp < CACHE_TTL;
  }, [cache, cacheKey]);

  const loadContacts = useCallback(async (forceRefresh = false) => {
    console.log('🚀 [UNIFIED_CONTACTS] Starting loadContacts', { 
      forceRefresh, 
      cacheValid: isCacheValid(),
      activeChannels: activeChannelIds.length 
    });
    
    // Verificar cache se não é refresh forçado
    if (!forceRefresh && isCacheValid() && cache) {
      console.log('✅ [UNIFIED_CONTACTS] Using cached data');
      setContacts(cache.data);
      return;
    }

    if (activeChannelIds.length === 0) {
      console.log('⚠️ [UNIFIED_CONTACTS] No active channels');
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(10);
    
    try {
      setLoadingProgress(30);
      
      // Usar o serviço otimizado
      const optimizedContacts = await OptimizedContactService.getContactsForChannels(activeChannelIds);
      
      setLoadingProgress(80);
      
      // Atualizar cache
      const newCache: ContactCache = {
        data: optimizedContacts,
        timestamp: Date.now(),
        channelKey: cacheKey
      };
      setCache(newCache);
      
      setContacts(optimizedContacts);
      setLoadingProgress(100);
      
      console.log('✅ [UNIFIED_CONTACTS] Contacts loaded and cached:', optimizedContacts.length);
      
    } catch (err) {
      console.error('❌ [UNIFIED_CONTACTS] Error loading contacts:', err);
      setError('Erro ao carregar contatos');
      setContacts([]);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  }, [activeChannelIds, isCacheValid, cache, cacheKey]);

  // Debounced load effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeChannelIds.length > 0) {
        loadContacts();
      } else {
        setContacts([]);
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [activeChannelIds, loadContacts]);

  const refetch = useCallback(() => {
    console.log('🔄 [UNIFIED_CONTACTS] Manual refetch triggered');
    OptimizedContactService.clearCache();
    setCache(null);
    loadContacts(true);
  }, [loadContacts]);

  return { 
    contacts, 
    loading, 
    error, 
    loadingProgress,
    refetch,
    hasChannels: activeChannelIds.length > 0
  };
};
