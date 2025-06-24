
/**
 * Utilidades simplificadas para mídia - apenas URLs
 */

export const isValidMediaUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Verificar se é URL HTTP válida
  return url.startsWith('http://') || url.startsWith('https://');
};

export const getMediaTypeFromUrl = (url: string): string => {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/)) {
    return 'image';
  }
  if (lowerUrl.match(/\.(mp4|webm|avi|mov)($|\?)/)) {
    return 'video';
  }
  if (lowerUrl.match(/\.(mp3|wav|ogg|m4a)($|\?)/)) {
    return 'audio';
  }
  if (lowerUrl.match(/\.(pdf|doc|docx|txt)($|\?)/)) {
    return 'document';
  }
  
  return 'unknown';
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
