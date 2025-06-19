
import { supabase } from '@/integrations/supabase/client';

// Cache para mapeamentos
let channelMappingCache: Record<string, string> = {};
let displayNameCache: Record<string, string> = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para gerar nome da tabela baseado no nome do canal
const generateTableName = (channelName: string): string => {
  return channelName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') + '_conversas';
};

// Função para gerar legacyId baseado no nome do canal
const generateLegacyId = (channelName: string): string => {
  return channelName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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

    // Preencher caches com canais do banco
    channels?.forEach(channel => {
      const tableName = generateTableName(channel.name);
      const legacyId = generateLegacyId(channel.name);
      
      // Mapear tanto por UUID quanto por legacyId
      channelMappingCache[channel.id] = tableName;
      channelMappingCache[legacyId] = tableName;
      
      displayNameCache[channel.id] = channel.name;
      displayNameCache[legacyId] = channel.name;
      
      console.log('📋 [CHANNEL_MAPPING] Mapeamento criado:', {
        name: channel.name,
        id: channel.id,
        legacyId,
        tableName
      });
    });

    // Mapeamentos legados para compatibilidade (sobrescrever se necessário)
    const legacyMappings: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };

    // Aplicar mapeamentos legados, mas não sobrescrever os novos
    Object.entries(legacyMappings).forEach(([legacyId, tableName]) => {
      if (!channelMappingCache[legacyId]) {
        channelMappingCache[legacyId] = tableName;
      }
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

  return channelMappingCache[channelId] || 'yelena_ai_conversas'; // Fallback
};

export const getChannelDisplayName = async (channelId: string): Promise<string> => {
  // Atualizar cache se necessário
  if (shouldUpdateCache() || Object.keys(displayNameCache).length === 0) {
    await loadChannelMappings();
  }

  return displayNameCache[channelId] || channelId;
};

// Versões síncronas para compatibilidade (usam cache)
export const getTableNameForChannelSync = (channelId: string): string => {
  return channelMappingCache[channelId] || 'yelena_ai_conversas';
};

export const getChannelDisplayNameSync = (channelId: string): string => {
  return displayNameCache[channelId] || channelId;
};

// Função para invalidar cache (usar após criar/editar/excluir canais)
export const invalidateChannelCache = (): void => {
  channelMappingCache = {};
  displayNameCache = {};
  lastCacheUpdate = 0;
  console.log('🔄 [CHANNEL_MAPPING] Cache invalidado - próxima consulta recarregará do banco');
};

// Inicializar cache na primeira importação
loadChannelMappings();

export type TableName = string;
