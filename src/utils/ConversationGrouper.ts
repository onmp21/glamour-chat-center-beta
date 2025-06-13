
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

      const contactName = ContactNameResolver.getResolvedName(phoneNumber) || msg.Nome_do_contato || `Cliente ${phoneNumber.slice(-4)}`;
      const lastMessageTime = msg.read_at || null;

      const conversationKey = `${phoneNumber}_${contactName}`;

      if (conversationsMap.has(conversationKey)) {
        const conversation = conversationsMap.get(conversationKey)!;
        
        // Atualizar apenas se a mensagem for mais recente
        if (lastMessageTime && (!conversation.last_message_time || lastMessageTime > conversation.last_message_time)) {
          conversationsMap.set(conversationKey, {
            ...conversation,
            last_message: msg.message,
            last_message_time: lastMessageTime,
            updated_at: lastMessageTime,
          });
        }
      } else {
        conversationsMap.set(conversationKey, {
          id: conversationKey,
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
