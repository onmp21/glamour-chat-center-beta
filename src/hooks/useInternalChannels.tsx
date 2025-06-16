import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

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

export const useInternalChannels = () => {
  const [channels, setChannels] = useState<InternalChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar canais diretamente do Supabase
    const fetchChannels = async () => {
      setLoading(true);
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
          legacyId: NAME_TO_LEGACYID[row.name] || row.id // fallback para id se não houver mapeamento
        }));
        setChannels(loadedChannels);
      }
      setLoading(false);
    };

    fetchChannels();
    // Opcional: subscribe realtime aqui se precisar (outra etapa)
  }, []);

  // Ajuda "refetch" explícito (usa mesma lógica acima)
  const refetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      const loadedChannels: InternalChannel[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type as InternalChannel['type'],
        isActive: row.is_active,
        isDefault: row.is_default,
        legacyId: NAME_TO_LEGACYID[row.name] || row.id
      }));
      setChannels(loadedChannels);
    }
    setLoading(false);
  };

  // O resto (updateChannelStatus etc) igual
  const saveChannels = (updatedChannels: InternalChannel[]) => {
    setChannels(updatedChannels);
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

      // Refaz loading após alteração (garante que a UI vai refletir o novo status)
      await refetch();
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
