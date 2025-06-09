
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

    // Usar ContactNameResolver para obter o nome correto
    const contactName = isAgent 
      ? 'Atendente'
      : ContactNameResolver.resolveContactName(
          phone,
          rawMessage.session_id,
          rawMessage.Nome_do_contato || rawMessage.nome_do_contato
        );

    return {
      id: rawMessage.id.toString(),
      content: content,
      timestamp: rawMessage.read_at || new Date().toISOString(),
      sender: isAgent ? 'agent' : 'customer',
      tipo_remetente: rawMessage.tipo_remetente,
      isOwn: isAgent,
      agentName: isAgent ? contactName : undefined,
      Nome_do_contato: contactName,
      nome_do_contato: rawMessage.nome_do_contato,
      mensagemtype: messageType
    };
  }

  static isDuplicate(messages: ChannelMessage[], newMessage: ChannelMessage): boolean {
    return messages.some(msg => msg.id === newMessage.id);
  }
}
