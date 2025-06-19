
export class MediaProcessor {
  // Processar mídia de forma assíncrona (método principal)
  static async processAsync(content: string, messageType: string = 'text'): Promise<string> {
    if (!content) return '';

    try {
      // Se já é uma URL completa, retornar como está
      if (content.startsWith('http')) {
        console.log(`🔗 [MEDIA_PROCESSOR] URL completa detectada:`, content.substring(0, 50));
        return content;
      }

      // Se é data URL (base64), processar
      if (content.startsWith('data:')) {
        console.log(`📄 [MEDIA_PROCESSOR] Data URL detectada:`, content.substring(0, 50));
        return content;
      }

      // Se parece ser base64 puro, formar data URL
      if (this.looksLikeBase64(content)) {
        const mimeType = this.detectMimeType(content, messageType);
        const dataUrl = `data:${mimeType};base64,${content}`;
        console.log(`🔄 [MEDIA_PROCESSOR] Base64 convertido para data URL:`, mimeType);
        return dataUrl;
      }

      // Caso contrário, retornar como texto
      return content;
    } catch (error) {
      console.error('❌ [MEDIA_PROCESSOR] Erro no processamento assíncrono:', error);
      return content;
    }
  }

  // Detectar se conteúdo parece base64
  private static looksLikeBase64(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // Verificar se contém apenas caracteres base64 válidos
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    const cleanContent = content.replace(/\s/g, '');
    
    return base64Pattern.test(cleanContent);
  }

  // Detectar tipo MIME baseado no conteúdo e tipo da mensagem
  private static detectMimeType(content: string, messageType: string): string {
    // Baseado no tipo da mensagem primeiro
    switch (messageType) {
      case 'image':
      case 'imageMessage':
        return this.detectImageMime(content) || 'image/jpeg';
      case 'audio':
      case 'audioMessage':
      case 'ptt':
        return this.detectAudioMime(content) || 'audio/mpeg';
      case 'video':
      case 'videoMessage':
        return this.detectVideoMime(content) || 'video/mp4';
      case 'document':
      case 'documentMessage':
        return this.detectDocumentMime(content) || 'application/pdf';
      default:
        // Tentar detectar automaticamente
        return this.detectImageMime(content) || 
               this.detectAudioMime(content) || 
               this.detectVideoMime(content) || 
               this.detectDocumentMime(content) || 
               'application/octet-stream';
    }
  }

  // Detectores específicos por tipo
  private static detectImageMime(content: string): string | null {
    if (content.startsWith('/9j/')) return 'image/jpeg';
    if (content.startsWith('iVBORw')) return 'image/png';
    if (content.startsWith('R0lGO')) return 'image/gif';
    if (content.startsWith('UklGR')) return 'image/webp';
    return null;
  }

  private static detectAudioMime(content: string): string | null {
    if (content.startsWith('SUQz') || content.startsWith('//uQ') || content.startsWith('//sw')) {
      return 'audio/mpeg';
    }
    if (content.startsWith('T2dn')) return 'audio/ogg';
    return null;
  }

  private static detectVideoMime(content: string): string | null {
    if (content.startsWith('AAAAGG') || content.startsWith('AAAAFG') || content.startsWith('AAAAHG')) {
      return 'video/mp4';
    }
    return null;
  }

  private static detectDocumentMime(content: string): string | null {
    if (content.startsWith('JVBERi')) return 'application/pdf';
    return null;
  }

  // Métodos síncronos mantidos para compatibilidade mas deprecados
  static processAudio(content: string): string {
    console.warn('⚠️ [MEDIA_PROCESSOR] processAudio() é deprecado, use processAsync()');
    return content;
  }

  static processImage(content: string): string {
    console.warn('⚠️ [MEDIA_PROCESSOR] processImage() é deprecado, use processAsync()');
    return content;
  }

  static processVideo(content: string): string {
    console.warn('⚠️ [MEDIA_PROCESSOR] processVideo() é deprecado, use processAsync()');
    return content;
  }

  static processDocument(content: string): string {
    console.warn('⚠️ [MEDIA_PROCESSOR] processDocument() é deprecado, use processAsync()');
    return content;
  }
}
