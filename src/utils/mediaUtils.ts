
/**
 * Utilidades para mídia - URLs e detecção de tipos
 */

export const isValidMediaUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Verificar se a URL contém placeholders não resolvidos
  if (url.includes('{{ $json.Key }}') || url.includes('{{') || url.includes('}}')) {
    return false;
  }
  
  // Verificar se é URL HTTP válida
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  // Verificar se é data URL
  if (url.startsWith('data:')) {
    return true;
  }
  
  return false;
};

export const getMediaTypeFromUrl = (url: string): string => {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  // Verificar extensões de arquivo
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/)) {
    return 'image';
  }
  if (lowerUrl.match(/\.(mp4|webm|avi|mov)($|\?)/)) {
    return 'video';
  }
  if (lowerUrl.match(/\.(mp3|wav|ogg|m4a|aac)($|\?)/)) {
    return 'audio';
  }
  if (lowerUrl.match(/\.(pdf|doc|docx|txt|xls|xlsx)($|\?)/)) {
    return 'document';
  }
  
  // Verificar content-type em data URLs
  if (url.startsWith('data:')) {
    if (url.includes('image/')) return 'image';
    if (url.includes('video/')) return 'video';
    if (url.includes('audio/')) return 'audio';
    if (url.includes('application/pdf')) return 'document';
  }
  
  return 'unknown';
};

export const getMediaTypeFromMessageType = (messageType: string): string => {
  if (!messageType) return 'text';
  
  const type = messageType.toLowerCase();
  
  switch (type) {
    case 'image':
    case 'imagemessage':
    case 'mensagem_de_imagem':
      return 'image';
    case 'video':
    case 'videomessage':
    case 'mensagem_de_video':
      return 'video';
    case 'audio':
    case 'audiomessage':
    case 'mensagem_de_audio':
    case 'ptt':
      return 'audio';
    case 'document':
    case 'documentmessage':
    case 'mensagem_de_documento':
    case 'file':
      return 'document';
    case 'sticker':
      return 'image';
    case 'text':
    case 'conversation':
      return 'text';
    default:
      return 'unknown';
  }
};

export const getMimeTypeFromUrl = (url: string): string => {
  if (!url) return 'application/octet-stream';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.match(/\.jpe?g($|\?)/)) return 'image/jpeg';
  if (lowerUrl.match(/\.png($|\?)/)) return 'image/png';
  if (lowerUrl.match(/\.gif($|\?)/)) return 'image/gif';
  if (lowerUrl.match(/\.webp($|\?)/)) return 'image/webp';
  if (lowerUrl.match(/\.svg($|\?)/)) return 'image/svg+xml';
  if (lowerUrl.match(/\.mp4($|\?)/)) return 'video/mp4';
  if (lowerUrl.match(/\.webm($|\?)/)) return 'video/webm';
  if (lowerUrl.match(/\.mp3($|\?)/)) return 'audio/mpeg';
  if (lowerUrl.match(/\.wav($|\?)/)) return 'audio/wav';
  if (lowerUrl.match(/\.ogg($|\?)/)) return 'audio/ogg';
  if (lowerUrl.match(/\.pdf($|\?)/)) return 'application/pdf';
  
  return 'application/octet-stream';
};

export const isImageUrl = (url: string): boolean => {
  return getMediaTypeFromUrl(url) === 'image';
};

export const isVideoUrl = (url: string): boolean => {
  return getMediaTypeFromUrl(url) === 'video';
};

export const isAudioUrl = (url: string): boolean => {
  return getMediaTypeFromUrl(url) === 'audio';
};

export const isMediaMessage = (content: string, messageType?: string): boolean => {
  // Verificar se o tipo de mensagem indica mídia
  if (messageType) {
    const mediaType = getMediaTypeFromMessageType(messageType);
    if (mediaType !== 'text' && mediaType !== 'unknown') {
      return true;
    }
  }
  
  // Verificar se o conteúdo é uma URL válida de mídia
  if (isValidMediaUrl(content)) {
    const mediaType = getMediaTypeFromUrl(content);
    return mediaType !== 'unknown' && mediaType !== 'text';
  }
  
  return false;
};
