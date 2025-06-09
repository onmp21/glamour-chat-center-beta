
export class MediaConverter {
  static convertBase64ToDataUrl(base64Content: string, mediaType: string): { 
    type: string; 
    url: string; 
    isProcessed: boolean; 
    size?: string;
    mimeType?: string;
  } {
    const mimeType = this.getMimeTypeFromMediaType(mediaType);
    const dataUrl = `data:${mimeType};base64,${base64Content}`;
    
    return {
      type: mediaType,
      url: dataUrl,
      isProcessed: true,
      size: this.estimateSize(base64Content),
      mimeType
    };
  }

  static getMimeTypeFromMediaType(mediaType: string): string {
    const typeMap: Record<string, string> = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'document': 'application/pdf'
    };
    
    return typeMap[mediaType] || 'application/octet-stream';
  }

  static getMediaTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('application/')) return 'document';
    
    return 'document'; // FIX: sempre retornar um tipo válido
  }

  static getMediaTypeFromMessageType(messageType: string): string | null {
    const validTypes = ['image', 'audio', 'video', 'document'];
    return validTypes.includes(messageType) ? messageType : null;
  }

  static estimateSize(base64Content: string): string {
    if (!base64Content) return 'Desconhecido';
    
    const bytes = (base64Content.length * 3) / 4;
    
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    
    return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
  }

  static validateAndCleanBase64(content: string): { 
    isValid: boolean; 
    cleanedContent?: string; 
    error?: string; 
  } {
    try {
      // Remover espaços, quebras de linha e outros caracteres
      const cleaned = content.replace(/[\s\n\r\t]/g, '');
      
      // Verificar se contém apenas caracteres base64 válidos
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
        return { 
          isValid: false, 
          error: 'Contém caracteres inválidos para base64' 
        };
      }
      
      // Verificar se o comprimento é múltiplo de 4
      if (cleaned.length % 4 !== 0) {
        return { 
          isValid: false, 
          error: 'Comprimento de base64 inválido (deve ser múltiplo de 4)' 
        };
      }
      
      // Verificar se é muito pequeno para ser mídia válida
      if (cleaned.length < 100) {
        return { 
          isValid: false, 
          error: 'Base64 muito pequeno para ser mídia válida' 
        };
      }
      
      return { 
        isValid: true, 
        cleanedContent: cleaned 
      };
      
    } catch (error) {
      return { 
        isValid: false, 
        error: `Erro na validação: ${error}` 
      };
    }
  }
}
