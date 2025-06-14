
// src/utils/channelMapping.ts
export const getTableNameForChannel = (channelId: string): string => {
  const mapping: Record<string, string> = {
    // UUIDs do Supabase
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas', // Yelena AI (Chat)
    '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas', // Canarana
    'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas', // Souto Soares
    '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas', // João Dourado
    '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas', // América Dourada
    'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas', // Gustavo Gerente Lojas
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas', // Andressa Gerente Externo
    // Nomes legados (manter se ainda usados em algum lugar como fallback, mas idealmente usar UUIDs)
    'chat': 'yelena_ai_conversas',
    'canarana': 'canarana_conversas',
    'souto-soares': 'souto_soares_conversas',
    'joao-dourado': 'joao_dourado_conversas',
    'america-dourada': 'america_dourada_conversas',
    'gerente-lojas': 'gerente_lojas_conversas',
    'gerente-externo': 'gerente_externo_conversas'
  };
  return mapping[channelId] || 'yelena_ai_conversas'; // Fallback to yelena_ai_conversas or a more generic default
};
