
/**
 * Utilitários reutilizáveis para manipulação de contatos e canais.
 */

// Retorna o nome amigável do canal dado o ID
export const getChannelDisplayName = (channelId: string): string => {
  const mapping: Record<string, string> = {
    'yelena-ai': 'Yelena-AI',
    'chat': 'Yelena-AI',
    'canarana': 'Canarana',
    'souto-soares': 'Souto Soares',
    'joao-dourado': 'João Dourado',
    'america-dourada': 'América Dourada',
    'gerente-externo': 'Andressa Gerente',
    'gerente-lojas': 'Gustavo Gerente'
  };
  return mapping[channelId?.toLowerCase()] || channelId;
};

// Agrupa contatos cross-canais, garantindo canais únicos e mensagem mais recente
export function groupContactsByPhone(allContacts: any[]) {
  const contactsMap = new Map<string, any>();
  allContacts.forEach(contact => {
    if (!contact) return;
    const key = contact.telefone;
    const existing = contactsMap.get(key);

    if (existing) {
      // Adiciona canais únicos
      contact.canais.forEach((c: string) => {
        if (!existing.canais.includes(c)) {
          existing.canais.push(c);
        }
      });
      // Mantém mensagens/campos mais recentes
      if (contact.lastMessageTime > existing.lastMessageTime) {
        existing.ultimaMensagem = contact.ultimaMensagem;
        existing.tempo = contact.tempo;
        existing.status = contact.status;
        existing.lastMessageTime = contact.lastMessageTime;
      }
    } else {
      contactsMap.set(key, { ...contact, canais: [...contact.canais] });
    }
  });

  return Array.from(contactsMap.values()).sort(
    (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
  );
}
