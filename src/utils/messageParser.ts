import { ContactNameResolver } from './ContactNameResolver';

export interface ParsedMessage {
  content: string;
  timestamp: string;
  type: 'human' | 'ai';
  sender?: string;
}

// Função para fazer parse de mensagens que agora são strings simples
export const parseMessageData = (message: any): ParsedMessage | null => {
  console.log('📄 [MESSAGE_PARSER] Processing message:', typeof message, message);
  
  // Se já é uma string, usar diretamente
  if (typeof message === 'string') {
    const content = message.trim();
    if (!content) {
      console.log('❌ [MESSAGE_PARSER] Empty string message');
      return null;
    }
    
    return {
      content,
      timestamp: new Date().toISOString(),
      type: 'human'
    };
  }
  
  // Se é um objeto JSON, tentar extrair o conteúdo
  if (typeof message === 'object' && message !== null) {
    try {
      let content = '';
      let timestamp = new Date().toISOString();
      let type: 'human' | 'ai' = 'human';
      let sender = '';

      // Diferentes formatos possíveis
      if (message.content) {
        content = String(message.content);
      } else if (message.message) {
        content = String(message.message);
      } else if (message.text) {
        content = String(message.text);
      } else {
        // Tentar usar o próprio objeto como string
        content = JSON.stringify(message);
      }

      if (message.timestamp) {
        timestamp = message.timestamp;
      }

      if (message.type) {
        type = message.type === 'ai' ? 'ai' : 'human';
      }

      if (message.sender) {
        sender = String(message.sender);
      }

      content = content.trim();
      if (!content) {
        console.log('❌ [MESSAGE_PARSER] No valid content found in object');
        return null;
      }

      console.log('✅ [MESSAGE_PARSER] Parsed object message:', { content: content.slice(0, 100), type, sender });
      return { content, timestamp, type, sender };
    } catch (error) {
      console.error('❌ [MESSAGE_PARSER] Error parsing object message:', error);
      return null;
    }
  }

  console.log('❌ [MESSAGE_PARSER] Invalid message format');
  return null;
};

// Função para extrair nome do remetente baseado no canal - ATUALIZADA
export const getChannelSenderName = (channelId: string, contactName: string, contactPhone?: string): string => {
  console.log(`👤 [MESSAGE_PARSER] Getting sender name for channel: ${channelId}, contact: ${contactName}`);
  
  // Se temos telefone, verificar se já há nome resolvido
  if (contactPhone) {
    const resolvedName = ContactNameResolver.getResolvedName(contactPhone);
    if (resolvedName) {
      console.log(`📝 [MESSAGE_PARSER] Using resolved name: ${resolvedName} for ${contactPhone}`);
      return resolvedName;
    }
  }
  
  // Mapeamento conforme solicitado
  const channelMappings: Record<string, string> = {
    // Gerente do externo -> andressa
    'gerente-externo': 'andressa',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'andressa',
    
    // Yelena-AI -> Óticas Villa Glamour
    'chat': 'Óticas Villa Glamour',
    'yelena-ai': 'Óticas Villa Glamour',
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Óticas Villa Glamour'
  };

  const mappedName = channelMappings[channelId];
  if (mappedName) {
    console.log(`📝 [MESSAGE_PARSER] Channel ${channelId} mapped to: ${mappedName}`);
    return mappedName;
  }

  // Para outros canais, usar o nome original
  console.log(`📝 [MESSAGE_PARSER] Using original contact name: ${contactName}`);
  return contactName || 'Cliente';
};
