
// Mapeamento de instâncias para tabelas
const instanceToTableMapping: Record<string, string> = {
  'yelena': 'yelena_ai_conversas',
  'yelena-ai': 'yelena_ai_conversas',
  'canarana': 'canarana_conversas',
  'souto-soares': 'souto_soares_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  'america-dourada': 'america_dourada_conversas',
  'gerente-lojas': 'gerente_lojas_conversas',
  'gerente-externo': 'gerente_externo_conversas' // CORRIGIDO: nome correto da tabela
};

// Função para determinar a tabela baseada na instância
const getTableForInstance = (instance: string): string => {
  const normalizedInstance = instance.toLowerCase().trim();
  
  // Tentar correspondência exata primeiro
  if (instanceToTableMapping[normalizedInstance]) {
    return instanceToTableMapping[normalizedInstance];
  }
  
  // Tentar correspondência parcial
  for (const [key, table] of Object.entries(instanceToTableMapping)) {
    if (normalizedInstance.includes(key) || key.includes(normalizedInstance)) {
      return table;
    }
  }
  
  // Fallback para yelena_ai_conversas se não encontrar correspondência
  console.log(`⚠️ [WEBHOOK] Instance '${instance}' not found in mapping, using yelena_ai_conversas as fallback`);
  return 'yelena_ai_conversas';
};

export { getTableForInstance, instanceToTableMapping };
