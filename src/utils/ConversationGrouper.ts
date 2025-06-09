
import { ChannelConversation, RawMessage } from '@/types/messages';
import { PhoneExtractor } from './PhoneExtractor';
import { ContactNameResolver } from './ContactNameResolver';

export class ConversationGrouper {
  static groupMessagesByPhone(rawMessages: RawMessage[], channelId: string): ChannelConversation[] {
    console.log(`🗂️ [CONVERSATION_GROUPER] Grouping messages by phone for channel: ${channelId}`);
    
    const conversationsMap = new Map<string, ChannelConversation>();

    rawMessages.forEach(msg => {
      if (!msg.session_id) return;

      const phoneNumber = PhoneExtractor.extractPhoneFromSessionId(msg.session_id);
      if (!phoneNumber) return;

      const contactName = ContactNameResolver.getResolvedName(phoneNumber) || `Cliente ${phoneNumber.slice(-4)}`;
      const lastMessageTime = msg.read_at || null;

      if (conversationsMap.has(phoneNumber)) {
        const conversation = conversationsMap.get(phoneNumber)!;
        
        // Atualizar apenas se a mensagem for mais recente
        if (lastMessageTime && (!conversation.last_message_time || lastMessageTime > conversation.last_message_time)) {
          conversationsMap.set(phoneNumber, {
            ...conversation,
            last_message: msg.message,
            last_message_time: lastMessageTime,
            updated_at: lastMessageTime,
          });
        }
      } else {
        conversationsMap.set(phoneNumber, {
          id: phoneNumber,
          contact_name: contactName,
          contact_phone: phoneNumber,
          last_message: msg.message,
          last_message_time: lastMessageTime,
          status: 'unread', // Assumir como não lida por padrão
          updated_at: lastMessageTime || new Date().toISOString(),
          unread_count: 0
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());
    console.log(`✅ [CONVERSATION_GROUPER] Grouped into ${conversations.length} conversations`);
    return conversations;
  }
}
