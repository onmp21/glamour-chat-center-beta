export interface MediaResult {
  isProcessed: boolean;
  url?: string;
  type?: string;
  mimeType?: string;
  size?: string;
  error?: string;
}

export class MediaProcessor {
  // Processar mídia de forma assíncrona (método principal)
  static async processAsync(content: string, messageType: string = 'text'): Promise<MediaResult> {
    if (!content) {
      return { isProcessed: false, error: 'Conteúdo vazio' };
    }

    try {
      // Regex para detectar URLs do Supabase Storage, incluindo o bucket 'file'
      const supabaseStorageUrlRegex = /^https:\/\/uxccfhptochnfomurulr\.supabase\.co\/storage\/v1\/object\/(public\/)?file\//;

      // Se é uma URL completa, verificar se é do Supabase Storage ou externa
      if (content.startsWith('http')) {
        console.log(`🔗 [MEDIA_PROCESSOR] URL detectada:`, content.substring(0, 50));
        return {
          isProcessed: true,
          url: content,
          type: this.getTypeFromMessageType(messageType) || this.getTypeFromUrl(content),
          mimeType: this.getMimeTypeFromUrl(content)
        };
      }

      // Se é uma URL relativa (ex: file/yelena/...), tratar como Supabase Storage
      if (content.startsWith('file/')) {
        const fullUrl = `https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/${content}`;
        console.log(`🔗 [MEDIA_PROCESSOR] URL relativa detectada, convertendo para:`, fullUrl.substring(0, 50));
        return {
          isProcessed: true,
          url: fullUrl,
          type: this.getTypeFromMessageType(messageType) || this.getTypeFromUrl(fullUrl),
          mimeType: this.getMimeTypeFromUrl(fullUrl)
        };
      }

      // Se é data URL (base64), processar
      if (content.startsWith('data:')) {
        console.log(`📄 [MEDIA_PROCESSOR] Data URL detectada:`, content.substring(0, 50));
        const mimeType = this.extractMimeFromDataUrl(content);
        return {
          isProcessed: true,
          url: content,
          type: this.getTypeFromMimeType(mimeType),
          mimeType
        };
      }

      // Se parece ser base64 puro, formar data URL
      if (this.looksLikeBase64(content)) {
        const mimeType = this.detectMimeType(content, messageType);
        const dataUrl = `data:${mimeType};base64,${content}`;
        console.log(`🔄 [MEDIA_PROCESSOR] Base64 convertido para data URL:`, mimeType);
        return {
          isProcessed: true,
          url: dataUrl,
          type: this.getTypeFromMimeType(mimeType),
          mimeType
        };
      }

      // Caso contrário, retornar como não processado
      return { isProcessed: false, error: 'Formato não reconhecido' };
    } catch (error) {
      console.error('❌ [MEDIA_PROCESSOR] Erro no processamento assíncrono:', error);
      return { isProcessed: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
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

  // Extrair MIME type de data URL
  private static extractMimeFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/^data:([^;]+)/);
    return match ? match[1] : 'application/octet-stream';
  }

  // Obter tipo da mensagem baseado no MIME type
  private static getTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'document';
    return 'document';
  }

  // Obter tipo baseado no tipo da mensagem
  private static getTypeFromMessageType(messageType: string): string {
    switch (messageType) {
      case 'imageMessage':
      case 'image':
        return 'image';
      case 'audioMessage':
      case 'audio':
      case 'ptt':
        return 'audio';
      case 'videoMessage':
      case 'video':
        return 'video';
      case 'documentMessage':
      case 'document':
        return 'document';
      case 'stickerMessage':
      case 'sticker':
        return 'sticker';
      default:
        return ''; // Retorna vazio para que getTypeFromUrl possa tentar detectar
    }
  }

  // Obter tipo de URL baseado na extensão
  private static getTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
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
        return 'audio';
      case 'mp4':
      case 'webm':
      case 'mov':
        return 'video';
      case 'pdf':
        return 'document';
      default:
        return 'document';
    }
  }

  // Obter MIME type de URL
  private static getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp3':
        return 'audio/mpeg';
      case 'ogg':
        return 'audio/ogg';
      case 'mp4':
        return 'video/mp4';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  // Obter ícone para tipo de mídia
  static getMediaIcon(type: string): string {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎥';
      case 'document':
        return '📄';
      case 'sticker':
        return '🏷️';
      default:
        return '📎';
    }
  }

  // Métodos síncronos mantidos para compatibilidade mas deprecados
  static processAudio(content: string): MediaResult {
    console.warn('⚠️ [MEDIA_PROCESSOR] processAudio() é deprecado, use processAsync()');
    return { isProcessed: false, error: 'Método deprecado' };
  }

  static processImage(content: string): MediaResult {
    console.warn('⚠️ [MEDIA_PROCESSOR] processImage() é deprecado, use processAsync()');
    return { isProcessed: false, error: 'Método deprecado' };
  }

  static processVideo(content: string): MediaResult {
    console.warn('⚠️ [MEDIA_PROCESSOR] processVideo() é deprecado, use processAsync()');
    return { isProcessed: false, error: 'Método deprecado' };
  }

  static processDocument(content: string): MediaResult {
    console.warn('⚠️ [MEDIA_PROCESSOR] processDocument() é deprecado, use processAsync()');
    return { isProcessed: false, error: 'Método deprecado' };
  }
}

