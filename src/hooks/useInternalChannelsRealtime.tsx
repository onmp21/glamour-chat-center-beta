
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from '@supabase/supabase-js';

export interface InternalChannel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
  legacyId: string;
}

// Mapeamento nome → legacyId
const NAME_TO_LEGACYID: Record<string, string> = {
  'Yelena-AI': 'chat',
  'Óticas Villa Glamour': 'chat',
  'Canarana': 'canarana',
  'Souto Soares': 'souto-soares',
  'João Dourado': 'joao-dourado',
  'América Dourada': 'america-dourada',
  'Gerente das Lojas': 'gerente-lojas',
  'Andressa Gerente Externo': 'gerente-externo'
};

const generateLegacyId = (channelName: string): string => {
  if (NAME_TO_LEGACYID[channelName]) {
    return NAME_TO_LEGACYID[channelName];
  }
  
  return channelName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const useInternalChannelsRealtime = () => {
  const [channels, setChannels] = useState<InternalChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useInternalChannelsRealtime] Erro ao buscar canais:', error);
        toast({
          title: "Erro ao carregar canais",
          description: "Não foi possível obter a lista de canais. Verifique sua conexão.",
          variant: "destructive"
        });
        setChannels([]);
      } else {
        const loadedChannels: InternalChannel[] = (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          type: row.type as InternalChannel['type'],
          isActive: row.is_active,
          isDefault: row.is_default,
          legacyId: generateLegacyId(row.name)
        }));
        
        console.log('✅ [useInternalChannelsRealtime] Canais carregados:', loadedChannels.map(c => ({ name: c.name, legacyId: c.legacyId })));
        
        if (mountedRef.current) {
          setChannels(loadedChannels);
        }
      }
    } catch (error) {
      console.error('[useInternalChannelsRealtime] Erro inesperado:', error);
      setChannels([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    mountedRef.current = true;

    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('✅ [useInternalChannelsRealtime] Setting up realtime subscription');

    // Criar subscrição realtime para a tabela channels
    const channel = supabase
      .channel('channels_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels'
        },
        (payload) => {
          console.log('🔥 [useInternalChannelsRealtime] Channel change:', payload);
          if (mountedRef.current) {
            fetchChannels();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [useInternalChannelsRealtime] Subscription status:', status);
      });

    channelRef.current = channel;

    // Load inicial
    fetchChannels();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        console.log('🔌 [useInternalChannelsRealtime] Cleaning up subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const updateChannelStatus = async (channelId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('channels')
        .update({ is_active: isActive })
        .eq('id', channelId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Canal ${isActive ? 'ativado' : 'desativado'} com sucesso`,
        variant: "default"
      });

      // O realtime atualizará automaticamente - não precisamos recarregar manualmente
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar canal. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const refetch = async () => {
    await fetchChannels();
  };

  return {
    channels,
    loading,
    updateChannelStatus,
    refetch
  };
};
