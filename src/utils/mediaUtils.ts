
export const extractPureBase64 = (mediaContent: string): string => {
  if (!mediaContent) return '';
  
  // Se já é data URL, extrair apenas o base64
  if (mediaContent.startsWith('data:')) {
    const parts = mediaContent.split(',');
    return parts.length > 1 ? parts[1] : '';
  }
  
  // Se já é base64 puro, retornar como está
  return mediaContent;
};

export const processMediaBase64 = (mediaBase64: string, messageType: string): string => {
  if (!mediaBase64) return '';
  
  // Se já tem prefixo data:, retornar como está
  if (mediaBase64.startsWith('data:')) {
    return mediaBase64;
  }
  
  // Se é uma URL HTTP, não processar como base64
  if (mediaBase64.startsWith('http://') || mediaBase64.startsWith('https://')) {
    console.log('📎 [MEDIA_UTILS] URL detectada, não processando como base64:', mediaBase64.substring(0, 50));
    return '';
  }
  
  // Verificar se parece com base64 válido
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(mediaBase64)) {
    console.log('❌ [MEDIA_UTILS] Base64 inválido detectado');
    return '';
  }
  
  // Determinar MIME type baseado no tipo de mensagem
  let mimeType = 'application/octet-stream';
  
  switch (messageType) {
    case 'image':
      mimeType = 'image/jpeg';
      break;
    case 'audio':
      mimeType = 'audio/mpeg';
      break;
    case 'video':
      mimeType = 'video/mp4';
      break;
    case 'document':
      mimeType = 'application/pdf';
      break;
    default:
      mimeType = 'application/octet-stream';
  }
  
  // Tentar detectar MIME type do header base64
  try {
    if (mediaBase64.startsWith('/9j/')) mimeType = 'image/jpeg';
    else if (mediaBase64.startsWith('iVBORw')) mimeType = 'image/png';
    else if (mediaBase64.startsWith('R0lGO')) mimeType = 'image/gif';
    else if (mediaBase64.startsWith('UklGR')) mimeType = 'image/webp';
    else if (mediaBase64.startsWith('JVBERi')) mimeType = 'application/pdf';
    else if (mediaBase64.startsWith('SUQz') || mediaBase64.startsWith('//uQ')) mimeType = 'audio/mpeg';
    else if (mediaBase64.startsWith('T2dn')) mimeType = 'audio/ogg';
    else if (mediaBase64.startsWith('AAAAGG') || mediaBase64.startsWith('AAAAFG')) mimeType = 'video/mp4';
  } catch (error) {
    console.warn('⚠️ [MEDIA_UTILS] Erro ao detectar MIME type:', error);
  }
  
  const dataUrl = `data:${mimeType};base64,${mediaBase64}`;
  console.log('✅ [MEDIA_UTILS] Base64 processado com sucesso para N8N:', mimeType);
  
  return dataUrl;
};

export const getFileFormatFromMimeType = (mimeType: string): string => {
  const mimeToFormat: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png', 
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  };
  
  return mimeToFormat[mimeType] || 'bin';
};

export const isValidBase64 = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  // Remover data URL prefix se existir
  const base64Data = str.startsWith('data:') 
    ? str.split(',')[1] 
    : str;
  
  if (!base64Data) return false;
  
  // Verificar padrão base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(base64Data);
};

export const extractMimeTypeFromDataUrl = (dataUrl: string): string => {
  if (!dataUrl.startsWith('data:')) return 'application/octet-stream';
  
  const mimeMatch = dataUrl.match(/^data:([^;]+)/);
  return mimeMatch ? mimeMatch[1] : 'application/octet-stream';
};
