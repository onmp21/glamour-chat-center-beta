
// CORRIGIDO: Mapeamento centralizado sem duplicatas
export const CHANNEL_TABLE_MAPPING: Record<string, string> = {
  // Usar apenas IDs legados para evitar contagem duplicada
  'chat': 'yelena_ai_conversas',
  'canarana': 'canarana_conversas', 
  'souto-soares': 'souto_soares_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  'america-dourada': 'america_dourada_conversas',
  'gerente-lojas': 'gerente_lojas_conversas',
  'gerente-externo': 'gerente_externo_conversas'
};

export const CHANNEL_DISPLAY_NAMES: Record<string, string> = {
  'chat': 'Yelena-AI',
  'canarana': 'Canarana',
  'souto-soares': 'Souto Soares', 
  'joao-dourado': 'João Dourado',
  'america-dourada': 'América Dourada',
  'gerente-lojas': 'Gustavo',
  'gerente-externo': 'Andressa'
};

// Type for table names - PADRONIZADO para aceitar qualquer string
export type TableName = string;

export const getAllChannelTables = (): string[] => {
  return Object.values(CHANNEL_TABLE_MAPPING);
};

export const getTableNameForChannelSync = (channelId: string): string => {
  const tableName = CHANNEL_TABLE_MAPPING[channelId];
  if (!tableName) {
    console.warn(`⚠️ [CHANNEL_MAPPING] No table mapping found for channel: ${channelId}`);
    return 'yelena_ai_conversas'; // fallback
  }
  console.log(`🗂️ [CHANNEL_MAPPING] ${channelId} -> ${tableName}`);
  return tableName;
};

// Alias for backward compatibility
export const getTableNameForChannel = getTableNameForChannelSync;

export const getChannelDisplayNameSync = (channelId: string): string => {
  const displayName = CHANNEL_DISPLAY_NAMES[channelId];
  if (!displayName) {
    console.warn(`⚠️ [CHANNEL_MAPPING] No display name found for channel: ${channelId}`);
    return channelId;
  }
  return displayName;
};

export const isValidChannel = (channelId: string): boolean => {
  return channelId in CHANNEL_TABLE_MAPPING;
};

export const debugChannelMapping = () => {
  console.group('🔍 [CHANNEL_MAPPING] Debug Info');
  console.log('Available mappings:', Object.keys(CHANNEL_TABLE_MAPPING));
  console.log('Table names:', Object.values(CHANNEL_TABLE_MAPPING));
  console.log('Display names:', CHANNEL_DISPLAY_NAMES);
  console.groupEnd();
};

// Cache invalidation function for backward compatibility
export const invalidateChannelCache = () => {
  console.log('🧹 [CHANNEL_MAPPING] Cache invalidation requested (no-op in new system)');
};
