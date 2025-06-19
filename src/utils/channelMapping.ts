
import { supabase } from '@/integrations/supabase/client';

// Cache para mapeamentos
let channelMappingCache: Record<string, string> = {};
let displayNameCache: Record<string, string> = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para gerar nome da tabela baseado no channelId
const getTableNameForChannelId = (channelId: string): string => {
  const channelMapping: Record<string, string> = {
    'chat': 'yelena_ai_conversas',
    'canarana': 'canarana_conversas',
    'souto-soares': 'souto_soares_conversas',
    'joao-dourado': 'joao_dourado_conversas',
    'america-dourada': 'america_dourada_conversas',
    'gerente-lojas': 'gerente_lojas_conversas',
    'gerente-externo': 'gerente_externo_conversas'
  };
  
  return channelMapping[channelId] || 'yelena_ai_conversas';
};

// Função para carregar mapeamentos do banco
const loadChannelMappings = async (): Promise<void> => {
  try {
    const { data: channels, error } = await supabase
      .from('channels')
      .select('id, name')
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao carregar mapeamentos de canais:', error);
      return;
    }

    // Limpar caches
    channelMappingCache = {};
    displayNameCache = {};

    // Preencher caches com mapeamento direto de channelId
    const directMappings: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };

    Object.assign(channelMappingCache, directMappings);

    // Preencher display names baseado nos canais do banco
    channels?.forEach(channel => {
      displayNameCache[channel.id] = channel.name;
    });

    lastCacheUpdate = Date.now();
    console.log('✅ Mapeamentos de canais carregados:', channelMappingCache);
  } catch (error) {
    console.error('Erro inesperado ao carregar mapeamentos:', error);
  }
};

// Função para verificar se cache precisa ser atualizado
const shouldUpdateCache = (): boolean => {
  return Date.now() - lastCacheUpdate > CACHE_DURATION;
};

export const getTableNameForChannel = async (channelId: string): Promise<string> => {
  // Atualizar cache se necessário
  if (shouldUpdateCache() || Object.keys(channelMappingCache).length === 0) {
    await loadChannelMappings();
  }

  return getTableNameForChannelId(channelId);
};

export const getChannelDisplayName = async (channelId: string): Promise<string> => {
  // Atualizar cache se necessário
  if (shouldUpdateCache() || Object.keys(displayNameCache).length === 0) {
    await loadChannelMappings();
  }

  return displayNameCache[channelId] || channelId;
};

// Versões síncronas para compatibilidade (usam mapeamento direto)
export const getTableNameForChannelSync = (channelId: string): string => {
  return getTableNameForChannelId(channelId);
};

export const getChannelDisplayNameSync = (channelId: string): string => {
  return displayNameCache[channelId] || channelId;
};

// Função para invalidar cache (usar após criar/editar/excluir canais)
export const invalidateChannelCache = (): void => {
  channelMappingCache = {};
  displayNameCache = {};
  lastCacheUpdate = 0;
};

// Inicializar cache na primeira importação
loadChannelMappings();

export type TableName = string;
