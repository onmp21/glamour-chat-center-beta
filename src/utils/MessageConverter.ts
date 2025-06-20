
import { RawMessage, ChannelMessage } from '@/types/messages';
import { MessageTypeMapper } from './MessageTypeMapper';
import { PhoneExtractor } from './PhoneExtractor';
import { ContactNameResolver } from './ContactNameResolver';

export class MessageConverter {
  static rawToChannelMessage(rawMessage: RawMessage): ChannelMessage {
    const phone = PhoneExtractor.extractPhoneFromSessionId(rawMessage.session_id);
    const messageType = MessageTypeMapper.mapMessageType(rawMessage.mensagemtype);
    
    // Usar media_base64 se existir para conteúdo de mídia, senão usar message
    const content = rawMessage.media_base64 || rawMessage.message;
    
    console.log('🔄 [MESSAGE_CONVERTER] Converting raw message:', {
      id: rawMessage.id,
      hasMediaBase64: !!rawMessage.media_base64,
      messageType,
      contentLength: content.length,
      originalMessageLength: rawMessage.message.length,
      Nome_do_contato: rawMessage.Nome_do_contato
    });

    const isAgent = rawMessage.tipo_remetente === 'USUARIO_INTERNO' || 
                   rawMessage.tipo_remetente === 'Yelena-ai' ||
                   rawMessage.tipo_remetente === 'Andressa-ai';

    // CORRIGIDO: Usar versão síncrona do ContactNameResolver
    const contactName = isAgent 
      ? 'Atendente'
      : ContactNameResolver.resolveContactNameSync(
          phone,
          rawMessage.session_id,
          rawMessage.Nome_do_contato || rawMessage.nome_do_contato
        );

    return {
      id: rawMessage.id.toString(),
      content: content,
      timestamp: rawMessage.read_at || new Date().toISOString(),
      sender: isAgent ? 'agent' : 'customer',
      type: 'text',
      isFromUser: !isAgent,
      session_id: rawMessage.session_id,
      tipo_remetente: rawMessage.tipo_remetente,
      mensagemtype: messageType,
      Nome_do_contato: contactName,
      nome_do_contato: rawMessage.nome_do_contato,
      contactName: contactName
    };
  }

  static isDuplicate(messages: ChannelMessage[], newMessage: ChannelMessage): boolean {
    return messages.some(msg => msg.id === newMessage.id);
  }
}
