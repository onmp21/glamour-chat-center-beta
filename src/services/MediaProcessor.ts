import { MediaDetector } from './media/MediaDetector';
import { MediaStorageService } from './MediaStorageService';

interface ProcessResult {
  isProcessed: boolean;
  url?: string;
  type?: string;
  mimeType?: string;
  size?: string;
  error?: string;
}

export class MediaProcessor {
  static async processAsync(content: string, messageType?: string): Promise<ProcessResult> {
    try {
      if (!content || content.length < 5) {
        return { isProcessed: false, error: 'Conteúdo muito pequeno' };
      }

      // Se já é uma URL pública válida do storage
      if (content.startsWith('https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/')) {
        return {
          isProcessed: true,
          url: content,
          type: this.detectMediaType(content, messageType),
          mimeType: this.getMimeTypeFromUrl(content)
        };
      }

      // Se é um data URL base64
      if (content.startsWith('data:')) {
        const uploadResult = await MediaStorageService.uploadBase64ToStorage(content);
        if (uploadResult.success && uploadResult.url) {
          return {
            isProcessed: true,
            url: uploadResult.url,
            type: this.detectMediaType(content, messageType),
            mimeType: this.getMimeTypeFromUrl(uploadResult.url)
          }
        } else {
          return { isProcessed: false, error: uploadResult.error || 'Erro ao enviar mídia ao storage' };
        }
      }

      // Se é um base64 puro
      if (MediaDetector.looksLikeBase64(content)) {
        const dataUrl = `data:${this.getMimeTypeFromType(messageType ?? 'image')};base64,${content}`;
        const uploadResult = await MediaStorageService.uploadBase64ToStorage(dataUrl);
        if (uploadResult.success && uploadResult.url) {
          return {
            isProcessed: true,
            url: uploadResult.url,
            type: messageType ?? 'image',
            mimeType: this.getMimeTypeFromUrl(uploadResult.url)
          }
        } else {
          return { isProcessed: false, error: 'Erro ao enviar base64 ao storage' };
        }
      }

      return { isProcessed: false, error: 'Não é conteúdo de mídia válido' };
    } catch (error) {
      console.error('❌ [MEDIA_PROCESSOR] Error:', error);
      return { isProcessed: false, error: 'Erro ao processar mídia' };
    }
  }

  static process(content: string, messageType?: string): ProcessResult {
    // Por compatibilidade, apenas retorna erro dizendo que só processa de forma assíncrona agora.
    return {
      isProcessed: false,
      error: 'Use processAsync para processar mídia corretamente!'
    };
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

  static detectMediaType(content: string, messageType?: string): string {
    if (messageType && messageType !== 'text') {
      return messageType;
    }
    
    // Para URLs (completas ou relativas), detectar pelo nome do arquivo
    if (content.startsWith('https://')) {
      const extension = content.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
          return 'image';
        case 'mp3':
        case 'ogg':
        case 'wav':
        case 'm4a':
          return 'audio';
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'webm':
          return 'video';
        case 'pdf':
        case 'doc':
        case 'docx':
        case 'txt':
          return 'document';
        default:
          // Se não tem extensão, tentar detectar pelo nome do arquivo
          if (content.includes('audio') || content.includes('Audio')) return 'audio';
          if (content.includes('video') || content.includes('Video')) return 'video';
          if (content.includes('image') || content.includes('Image')) return 'image';
          return 'document';
      }
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

  static getMediaIcon(type: string): string {
    switch (type) {
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      case 'document': return '📄';
      default: return '📎';
    }
  }
}eturn '📎';
    }
  }
}
