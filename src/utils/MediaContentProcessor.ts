
import { Base64Utils } from './base64Utils';

export class MediaContentProcessor {
  static processMediaContent(content: string, messageType: string): string {
    console.log('🎯 [MEDIA_PROCESSOR] Processando:', { 
      messageType, 
      contentLength: content?.length || 0,
      isDataUrl: content?.startsWith('data:') || false
    });

    // Verificar se é conteúdo Base64 e converter para data URL se necessário
    if (messageType !== 'text' && content && !content.startsWith('data:')) {
      // Se é um Base64 puro, usar Base64Utils para processar
      if (this.isBase64Content(content)) {
        const result = Base64Utils.formatBase64String(content);
        
        if (result.isValid && result.formatted) {
          console.log('✅ [MEDIA_PROCESSOR] Base64 processado com sucesso');
          return result.formatted;
        } else {
          console.error('❌ [MEDIA_PROCESSOR] Erro ao processar base64:', result.error);
          // Fallback para método antigo
          const mimeType = this.getMimeTypeFromMessageType(messageType);
          return `data:${mimeType};base64,${content}`;
        }
      }
    }
    
    console.log('🎯 [MEDIA_PROCESSOR] Conteúdo retornado sem modificação');
    return content;
  }

  private static isBase64Content(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // Usar Base64Utils para validação mais robusta
    return Base64Utils.isValidBase64(content);
  }

  private static getMimeTypeFromMessageType(messageType: string): string {
    const typeMap: Record<string, string> = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'document': 'application/octet-stream',
      'sticker': 'image/webp'
    };
    
    return typeMap[messageType] || 'application/octet-stream';
  }
}
