/**
 * Utilitários comuns para detecção/tratamento de base64/mídia
 */

// Detecta se uma string é um DataURL base64
export function isDataUrl(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
}

// Detecta se uma string é um base64 cru (tipo mp3, png, etc)
export function isRawBase64(str: string): boolean {
  if (typeof str !== 'string' || str.length < 32) return false;
  if (str.startsWith('data:')) return false;
  return /^[A-Za-z0-9+/=\s]+$/.test(str) && /[A-Za-z0-9+/]{20,}/.test(str);
}

// Detecta o mime type baseando-se nos primeiros chars do base64
export function detectMimeTypeFromBase64(base64: string): string {
  if (base64.startsWith('iVBORw')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('R0lGO')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('Qk0') || base64.startsWith('Qk1')) return 'image/bmp';
  if (base64.startsWith('JVBERi')) return 'application/pdf';
  if (base64.startsWith('SUQz') || base64.startsWith('//uQ') || base64.startsWith('//sw')) return 'audio/mpeg';
  if (base64.startsWith('T2dn')) return 'audio/ogg';
  if (base64.startsWith('AAAAGG') || base64.startsWith('AAAAFG') || base64.startsWith('AAAAHG')) return 'video/mp4';
  return 'application/octet-stream';
}

// Garante formato DataURL para qualquer mídia base64 (ou retorna url/inexistente)
export function toDataUrlIfBase64(mediaUrl: string | undefined): string | undefined {
  if (!mediaUrl) return undefined;
  if (typeof mediaUrl !== 'string') return undefined;
  if (mediaUrl.startsWith('data:')) return mediaUrl;
  if (isRawBase64(mediaUrl)) {
    const cleanBase64 = mediaUrl.replace(/\s/g, '');
    const mimeType = detectMimeTypeFromBase64(cleanBase64);
    return `data:${mimeType};base64,${cleanBase64}`;
  }
  return mediaUrl;
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
