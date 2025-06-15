
/**
 * Utilitários comuns para detecção/tratamento de base64/mídia
 */

// Detecta se uma string é um DataURL base64
export function isDataUrl(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
}

// Detecta tipo e placeholder de acordo com campos do messageData
export function getMediaSaveDetails(messageData: any) {
  if (messageData?.message?.imageMessage) return { type: 'image', placeholder: '[Imagem]', mediaUrl: messageData.message.imageMessage.url };
  if (messageData?.message?.audioMessage) return { type: 'audio', placeholder: '[Áudio]', mediaUrl: messageData.message.audioMessage.url };
  if (messageData?.message?.videoMessage) return { type: 'video', placeholder: '[Vídeo]', mediaUrl: messageData.message.videoMessage.url };
  if (messageData?.message?.documentMessage) return { type: 'document', placeholder: '[Documento]', mediaUrl: messageData.message.documentMessage.url };
  return { type: 'text', placeholder: undefined, mediaUrl: undefined };
}

// Retorna o texto de mensagem (usado para texto/extended/caption)
export function getMessageContent(messageData: any) {
  return messageData.message?.conversation ||
    messageData.message?.extendedTextMessage?.text ||
    messageData.message?.imageMessage?.caption ||
    messageData.message?.audioMessage?.caption ||
    messageData.message?.videoMessage?.caption ||
    messageData.message?.documentMessage?.caption ||
    '[Mídia]';
}
