
export type TableName = 
  | 'yelena_ai_conversas'
  | 'canarana_conversas'
  | 'souto_soares_conversas'
  | 'joao_dourado_conversas'
  | 'america_dourada_conversas'
  | 'gerente_lojas_conversas'
  | 'gerente_externo_conversas';

export const getTableNameForChannel = (channelId: string): TableName => {
  const mapping: Record<string, TableName> = {
    'chat': 'yelena_ai_conversas',
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
    'canarana': 'canarana_conversas',
    'souto-soares': 'souto_soares_conversas',
    'joao-dourado': 'joao_dourado_conversas',
    'america-dourada': 'america_dourada_conversas',
    'gerente-lojas': 'gerente_lojas_conversas',
    'gerente-externo': 'gerente_externo_conversas',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
  };
  
  return mapping[channelId] || 'yelena_ai_conversas';
};

export const getChannelDisplayName = (channelId: string): string => {
  const mapping: Record<string, string> = {
    'chat': 'Yelena AI',
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Yelena AI',
    'canarana': 'Canarana',
    'souto-soares': 'Souto Soares',
    'joao-dourado': 'João Dourado',
    'america-dourada': 'América Dourada',
    'gerente-lojas': 'Gerente Lojas',
    'gerente-externo': 'Gerente Externo',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'Gerente Externo'
  };
  
  return mapping[channelId] || 'Canal Desconhecido';
};
