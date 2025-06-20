
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import PollingManager from '@/services/PollingManager';

// Reflete a tipagem real da tabela channels do Supabase + legacyId para o sistema
export interface InternalChannel {
  id: string;                   // UUID do canal no Supabase
  name: string;                 // Nome na tabela
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
  legacyId: string;             // mapeamento "chat", "canarana", etc.
}

// Mapeamento nome → legacyId (para garantir compatibilidade)
const NAME_TO_LEGACYID: Record<string, string> = {
  'Yelena-AI': 'chat',
  'Óticas Villa Glamour': 'chat',
  'Canarana': 'canarana',
  'Souto Soares': 'souto-soares',
  'João Dourado': 'joao-dourado',
  'América Dourada': 'america-dourada',
  'Gerente das Lojas': 'gerente-lojas', // PADRÃO CORRETO!
  'Andressa Gerente Externo': 'gerente-externo'
};

// Função para gerar legacyId baseado no nome do canal
const generateLegacyId = (channelName: string): string => {
  // Primeiro, verificar se existe um mapeamento explícito
  if (NAME_TO_LEGACYID[channelName]) {
    return NAME_TO_LEGACYID[channelName];
  }
  
  // Se não existe, gerar um legacyId baseado no nome
  return channelName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const useInternalChannels = () => {
  const [channels, setChannels] = useState<InternalChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para carregar canais do Supabase
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useInternalChannels] Erro ao buscar canais do Supabase:', error);
        toast({
          title: "Erro ao carregar canais",
          description: "Não foi possível obter a lista de canais. Verifique sua conexão.",
          variant: "destructive"
        });
        setChannels([]);
      } else {
        // Converter o formato vindo do banco para InternalChannel + atribuir legacyId
        const loadedChannels: InternalChannel[] = (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          type: row.type as InternalChannel['type'],
          isActive: row.is_active,
          isDefault: row.is_default,
          legacyId: generateLegacyId(row.name) // Usar função dinâmica
        }));
        
        console.log('✅ [useInternalChannels] Canais carregados:', loadedChannels.map(c => ({ name: c.name, legacyId: c.legacyId })));
        setChannels(loadedChannels);
      }
    } catch (error) {
      console.error('[useInternalChannels] Erro inesperado:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();

    // Usar polling em vez de realtime subscription para evitar erro de subscribe múltiplo
    const pollingCallback = () => {
      console.log('🔄 [useInternalChannels] Polling update for channels');
      fetchChannels();
    };

    const manager = PollingManager.getInstance();
    const pollingId = manager.startPolling('channels', pollingCallback, 10000); // 10 segundos

    return () => {
      manager.stopPolling('channels', pollingId);
    };
  }, []);

  // Função refetch explícita
  const refetch = async () => {
    await fetchChannels();
  };

  const updateChannelStatus = async (channelId: string, isActive: boolean) => {
    try {
      // Atualiza direto no Supabase
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

      // Recarregar manualmente após atualização
      await fetchChannels();
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar canal. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return {
    channels,
    loading,
    updateChannelStatus,
    refetch
  };
};
