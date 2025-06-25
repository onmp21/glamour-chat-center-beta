
export interface MessageGroup {
  id: string;
  messages: any[];
  sender: string;
  senderName: string;
  isFromContact: boolean;
  lastTimestamp: string;
}

export const groupConsecutiveMessages = (messages: any[]): MessageGroup[] => {
  if (!messages || messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((message) => {
    const isFromContact = message.tipo_remetente === 'CONTATO_EXTERNO';
    const senderName = isFromContact 
      ? (message.Nome_do_contato || message.nome_do_contato || 'Cliente')
      : 'Agente';
    
    const sender = isFromContact ? 'contact' : 'agent';

    // Se não há grupo atual ou o remetente mudou, criar novo grupo
    if (!currentGroup || currentGroup.sender !== sender || currentGroup.senderName !== senderName) {
      currentGroup = {
        id: `group-${message.id}`,
        messages: [message],
        sender,
        senderName,
        isFromContact,
        lastTimestamp: message.timestamp || message.read_at || ''
      };
      groups.push(currentGroup);
    } else {
      // Adicionar mensagem ao grupo atual
      currentGroup.messages.push(message);
      currentGroup.lastTimestamp = message.timestamp || message.read_at || '';
    }
  });

  return groups;
};
