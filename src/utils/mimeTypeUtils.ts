
interface MimeTypeMap {
  [key: string]: string;
}

export class MimeTypeUtils {
  private static readonly TYPE_MAP: MimeTypeMap = {
    'audio': 'audio/mpeg',
    'mensagem_de_audio': 'audio/mpeg',
    'voice': 'audio/mpeg',
    'ptt': 'audio/mpeg',
    'image': 'image/jpeg',
    'mensagem_de_imagem': 'image/jpeg',
    'photo': 'image/jpeg',
    'video': 'video/mp4',
    'mensagem_de_video': 'video/mp4',
    'document': 'application/pdf',
    'file': 'application/pdf',
    'text': 'text/plain'
  };

  private static readonly MIME_FIXES: MimeTypeMap = {
    'application/octet-stream': 'audio/mpeg', // Default fix for octet-stream
    'text/plain': 'text/plain'
  };

  static inferMimeType(messageType: string): string {
    console.log(`🔍 [MIME_UTILS] Inferring MIME type for messageType: ${messageType}`);
    
    const result = this.TYPE_MAP[messageType?.toLowerCase()] || 'application/octet-stream';
    console.log(`✅ [MIME_UTILS] Inferred MIME: ${result}`);
    return result;
  }

  static fixMimeType(dataUrl: string, messageType: string): string {
    if (!dataUrl.startsWith('data:')) return dataUrl;

    const currentMime = dataUrl.match(/data:([^;]+)/)?.[1];
    console.log(`🔧 [MIME_UTILS] Checking MIME type: ${currentMime} for messageType: ${messageType}`);

    // Special case: fix application/octet-stream for audio
    if (currentMime === 'application/octet-stream' && 
        (messageType === 'audio' || messageType === 'mensagem_de_audio')) {
      const corrected = dataUrl.replace('data:application/octet-stream', 'data:audio/mpeg');
      console.log(`🔧 [MIME_UTILS] Fixed octet-stream to audio/mpeg`);
      return corrected;
    }

    // Apply other fixes if needed
    if (currentMime && this.MIME_FIXES[currentMime]) {
      const targetMime = messageType.includes('audio') ? 'audio/mpeg' : this.MIME_FIXES[currentMime];
      if (targetMime !== currentMime) {
        const corrected = dataUrl.replace(`data:${currentMime}`, `data:${targetMime}`);
        console.log(`🔧 [MIME_UTILS] Fixed ${currentMime} to ${targetMime}`);
        return corrected;
      }
    }

    return dataUrl;
  }
}
