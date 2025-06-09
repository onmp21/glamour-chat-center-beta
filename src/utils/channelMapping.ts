export type TableName = 
  | 'yelena_ai_conversas'
  | 'canarana_conversas' 
  | 'souto_soares_conversas'
  | 'joao_dourado_conversas'
  | 'america_dourada_conversas'
  | 'gerente_lojas_conversas'
  | 'gerente_externo_conversas';

export type ChannelId = 
  | 'chat'
  | 'canarana'
  | 'souto-soares'
  | 'joao-dourado'
  | 'america-dourada'
  | 'gerente-lojas'
  | 'gerente-externo';

const channelToTableMapping: Record<ChannelId, TableName> = {
  'chat': 'yelena_ai_conversas',
  'canarana': 'canarana_conversas',
  'souto-soares': 'souto_soares_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  'america-dourada': 'america_dourada_conversas',
  'gerente-lojas': 'gerente_lojas_conversas',
  'gerente-externo': 'gerente_externo_conversas'
};

export const ADDITIONAL_TABLES = [
  'api_instances',
  'channel_api_mappings'
] as const;

export type AdditionalTableName = typeof ADDITIONAL_TABLES[number];
export type AllTableName = TableName | AdditionalTableName;

export const getTableNameForChannel = (channelId: string): TableName => {
  console.log(`🔍 Mapeando canal: ${channelId}`);
  
  // Validate that the channelId is a valid ChannelId
  if (!isValidChannelId(channelId)) {
    console.error(`❌ Canal não encontrado no mapeamento: ${channelId}`);
    throw new Error(`Table mapping not found for channel: ${channelId}`);
  }
  
  const tableName = channelToTableMapping[channelId as ChannelId];
  console.log(`✅ Canal: ${channelId} -> Tabela: ${tableName}`);
  return tableName;
};

export const getChannelDisplayName = (channelId: string): string => {
  const displayNames: Record<string, string> = {
    'chat': 'Yelena-AI',
    'canarana': 'Canarana',
    'souto-soares': 'Souto Soares',
    'joao-dourado': 'João Dourado',
    'america-dourada': 'América Dourada',
    'gerente-lojas': 'Gustavo Gerente das Lojas',
    'gerente-externo': 'Andressa Gerente Externo'
  };
  
  return displayNames[channelId] || channelId;
};

export const getAllChannelIds = (): ChannelId[] => {
  return Object.keys(channelToTableMapping) as ChannelId[];
};

export const isValidChannelId = (channelId: string): channelId is ChannelId => {
  return channelId in channelToTableMapping;
};
