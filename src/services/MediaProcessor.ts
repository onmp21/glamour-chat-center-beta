
import { MediaDetector } from './media/MediaDetector';

interface ProcessResult {
  isProcessed: boolean;
  url?: string;
  type?: string;
  mimeType?: string;
  size?: string;
  error?: string;
}

export class MediaProcessor {
  static process(content: string, messageType?: string): ProcessResult {
    try {
      // Não processar conteúdo muito pequeno ou vazio
      if (!content || content.length < 20) {
        return { isProcessed: false, error: 'Conteúdo muito pequeno' };
      }

      // Se já é URL do storage, retornar como está
      if (content.includes('supabase.co/storage/v1/object/public/media-files/')) {
        return {
          isProcessed: true,
          url: content,
          type: this.detectMediaType(content, messageType),
          mimeType: this.getMimeTypeFromUrl(content)
        };
      }

      // Verificar se é data URL válido
      if (content.startsWith('data:')) {
        return this.processDataUrl(content, messageType);
      }

      // Verificar se parece base64 puro
      if (MediaDetector.looksLikeBase64(content)) {
        return this.processBase64(content, messageType);
      }

      // Não é mídia válida
      return { isProcessed: false, error: 'Não é conteúdo de mídia válido' };

    } catch (error) {
      console.error('❌ [MEDIA_PROCESSOR] Error:', error);
      return { isProcessed: false, error: 'Erro ao processar mídia' };
    }
  }

  static processImage(content: string): ProcessResult {
    return this.process(content, 'image');
  }

  static processAudio(content: string): ProcessResult {
    return this.process(content, 'audio');
  }

  static processVideo(content: string): ProcessResult {
    return this.process(content, 'video');
  }

  private static processDataUrl(content: string, messageType?: string): ProcessResult {
    try {
      const [header, base64Data] = content.split(',');
      
      if (!header || !base64Data) {
        return { isProcessed: false, error: 'Data URL inválido' };
      }

      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      // Validar base64
      if (!this.isValidBase64(base64Data)) {
        return { isProcessed: false, error: 'Base64 inválido' };
      }

      const type = this.getTypeFromMimeType(mimeType);
      const size = this.calculateSize(base64Data);

      return {
        isProcessed: true,
        url: content,
        type,
        mimeType,
        size
      };

    } catch (error) {
      return { isProcessed: false, error: 'Erro ao processar data URL' };
    }
  }

  private static processBase64(content: string, messageType?: string): ProcessResult {
    try {
      if (!this.isValidBase64(content)) {
        return { isProcessed: false, error: 'Base64 inválido' };
      }

      const detectedType = MediaDetector.detectMediaTypeFromBase64(content);
      const type = messageType || detectedType;
      const mimeType = this.getMimeTypeFromType(type);
      
      // Converter para data URL
      const dataUrl = `data:${mimeType};base64,${content}`;
      const size = this.calculateSize(content);

      return {
        isProcessed: true,
        url: dataUrl,
        type,
        mimeType,
        size
      };

    } catch (error) {
      return { isProcessed: false, error: 'Erro ao processar base64' };
    }
  }

  static detectMediaType(content: string, messageType?: string): string {
    if (messageType && messageType !== 'text') {
      return messageType;
    }

    if (content.startsWith('data:')) {
      const mimeMatch = content.match(/data:([^;]+)/);
      if (mimeMatch) {
        return this.getTypeFromMimeType(mimeMatch[1]);
      }
    }

    if (MediaDetector.looksLikeBase64(content)) {
      return MediaDetector.detectMediaTypeFromBase64(content);
    }

    return 'unknown';
  }

  private static getTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'document';
    return 'document';
  }

  private static getMimeTypeFromType(type: string): string {
    switch (type) {
      case 'image': return 'image/jpeg';
      case 'audio': return 'audio/mpeg';
      case 'video': return 'video/mp4';
      case 'document': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  private static getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'mp3': return 'audio/mpeg';
      case 'ogg': return 'audio/ogg';
      case 'mp4': return 'video/mp4';
      case 'pdf': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  private static isValidBase64(base64: string): boolean {
    try {
      const cleaned = base64.replace(/[\s\n\r\t]/g, '');
      return /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) && cleaned.length % 4 === 0;
    } catch {
      return false;
    }
  }

  private static calculateSize(base64: string): string {
    const bytes = (base64.length * 3) / 4;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  static getMediaIcon(type: string): string {
    switch (type) {
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      case 'document': return '📄';
      default: return '📎';
    }
  }
}
