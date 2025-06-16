
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { OptimizedContactService, OptimizedContact } from '@/services/OptimizedContactService';

export const useUnifiedContacts = () => {
  const [contacts, setContacts] = useState<OptimizedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth();

  // Mapeamento de canais para IDs do sistema
  const getChannelMapping = () => {
    const mapping: Record<string, string> = {
      'Yelena-AI': 'chat',
      'Canarana': 'canarana',
      'Souto Soares': 'souto-soares',
      'João Dourado': 'joao-dourado',
      'América Dourada': 'america-dourada',
      'Gustavo Gerente das Lojas': 'gerente-lojas',
      'Andressa Gerente Externo': 'gerente-externo'
    };
    
    return mapping;
  };

  const loadContacts = async () => {
    if (!user || !user.name) {
      console.log('⚠️ [UNIFIED_CONTACTS] Usuário não autenticado');
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(10);
    
    try {
      const channelMapping = getChannelMapping();
      let activeChannelIds: string[] = [];

      if (user.role === 'admin') {
        // Admin pode ver todos os canais ativos, exceto Pedro
        activeChannelIds = channels
          .filter(c => c.isActive && c.name && c.name.toLowerCase() !== 'pedro')
          .map(c => channelMapping[c.name as keyof typeof channelMapping])
          .filter(id => id);
      } else {
        // Usuário comum vê apenas canais acessíveis
        const accessibleChannels = getAccessibleChannels();
        activeChannelIds = channels
          .filter(c => c.isActive && c.name && c.name.toLowerCase() !== 'pedro')
          .map(c => channelMapping[c.name as keyof typeof channelMapping])
          .filter(id => id && accessibleChannels.includes(id));
      }

      console.log('🔍 [UNIFIED_CONTACTS] Loading contacts for channels:', activeChannelIds);
      
      if (activeChannelIds.length === 0) {
        console.log('⚠️ [UNIFIED_CONTACTS] Nenhum canal ativo encontrado');
        setContacts([]);
        setLoading(false);
        return;
      }

      setLoadingProgress(30);
      
      const unifiedContacts = await OptimizedContactService.getContactsForChannels(activeChannelIds);
      
      setLoadingProgress(80);
      setContacts(unifiedContacts);
      setLoadingProgress(100);
      
      console.log(`✅ [UNIFIED_CONTACTS] Loaded ${unifiedContacts.length} unified contacts`);
      
    } catch (err) {
      console.error('❌ [UNIFIED_CONTACTS] Error loading contacts:', err);
      setError('Erro ao carregar contatos');
      setContacts([]);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      loadContacts();
    }
  }, [channels, user?.role, user?.name]);

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
