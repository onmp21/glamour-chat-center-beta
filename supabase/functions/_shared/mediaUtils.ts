
export function getMediaTypeFromMessage(message: any): string {
  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'document';
  if (message.stickerMessage) return 'sticker';
  return 'text';
}

export function getMediaUrlFromMessage(message: any): string | null {
  if (message.imageMessage?.url) return message.imageMessage.url;
  if (message.audioMessage?.url) return message.audioMessage.url;
  if (message.videoMessage?.url) return message.videoMessage.url;
  if (message.documentMessage?.url) return message.documentMessage.url;
  return null;
}

export function getMediaCaptionFromMessage(message: any, messageType: string): string {
  switch (messageType) {
    case 'image':
      return message.imageMessage?.caption || '[Imagem]';
    case 'video':
      return message.videoMessage?.caption || '[Vídeo]';
    case 'document':
      return message.documentMessage?.caption || '[Documento]';
    case 'audio':
      return '[Áudio]';
    case 'sticker':
      return '[Figurinha]';
    default:
      return '[Mensagem não suportada]';
  }
}

export async function downloadMediaAsBase64(mediaUrl: string): Promise<string | null> {
  try {
    console.log('📥 [MEDIA_UTILS] Downloading media from:', mediaUrl);
    
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      console.error('❌ [MEDIA_UTILS] HTTP error:', response.status);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Detect MIME type from response headers or URL
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    console.log('✅ [MEDIA_UTILS] Media converted to base64 successfully');
    return dataUrl;
  } catch (error) {
    console.error('❌ [MEDIA_UTILS] Error downloading media:', error);
    return null;
  }
}
