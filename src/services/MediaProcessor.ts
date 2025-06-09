
import { Base64Utils } from '@/utils/base64Utils';

export interface MediaResult {
  type: 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'text';
  url: string;
  mimeType?: string;
  size?: string;
  isProcessed: boolean;
  error?: string;
}

export class MediaProcessor {
  /**
   * Processa conteúdo de mídia com detecção melhorada
   */
  static process(content: string, messageType?: string): MediaResult {
    console.log('🎯 [MEDIA_PROCESSOR] Processing:', {
      contentLength: content?.length || 0,
      messageType,
      startsWithData: content?.startsWith('data:'),
      firstChars: content?.substring(0, 50)
    });

    if (!content || typeof content !== 'string') {
      return {
        type: 'text',
        url: content || '',
        isProcessed: false,
        error: 'Conteúdo inválido'
      };
    }

    // Se é texto curto sem dados, tratar como texto
    if (content.length < 100 && !content.startsWith('data:') && !this.looksLikeBase64(content)) {
      return {
        type: 'text',
        url: content,
        isProcessed: false
      };
    }

    // Detectar tipo de mídia
    const detectedType = this.detectMediaType(content, messageType);
    
    if (detectedType === 'text') {
      return {
        type: 'text',
        url: content,
        isProcessed: false
      };
    }

    // Processar mídia
    let processedUrl = content;
    let mimeType: string | undefined;
    
    try {
      if (content.startsWith('data:')) {
        // Já é data URL
        const mimeMatch = content.match(/data:([^;,]+)/);
        mimeType = mimeMatch ? mimeMatch[1] : this.getDefaultMimeType(detectedType);
        processedUrl = content;
        
        console.log('✅ [MEDIA_PROCESSOR] Data URL processada:', {
          type: detectedType,
          mimeType,
          size: this.calculateSize(content)
        });
      } else if (this.looksLikeBase64(content)) {
        // É base64 puro, converter para data URL
        const cleanResult = this.cleanBase64(content);
        if (!cleanResult.isValid) {
          throw new Error(cleanResult.error || 'Base64 inválido');
        }
        
        // Detectar MIME type do conteúdo
        mimeType = Base64Utils.detectMimeType(content);
        if (mimeType === 'application/octet-stream') {
          mimeType = this.getDefaultMimeType(detectedType);
        }
        
        processedUrl = `data:${mimeType};base64,${cleanResult.cleaned}`;
        
        console.log('✅ [MEDIA_PROCESSOR] Base64 convertido:', {
          type: detectedType,
          mimeType,
          originalSize: content.length,
          cleanedSize: cleanResult.cleaned.length
        });
      } else {
        throw new Error('Formato de mídia não reconhecido');
      }

      return {
        type: detectedType,
        url: processedUrl,
        mimeType,
        size: this.calculateSize(processedUrl),
        isProcessed: true
      };
    } catch (error) {
      console.error('❌ [MEDIA_PROCESSOR] Erro no processamento:', error);
      return {
        type: detectedType,
        url: content,
        isProcessed: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Detecta se o conteúdo parece ser base64
   */
  static looksLikeBase64(content: string): boolean {
    if (!content || content.length < 100) return false;
    
    // Limpar espaços
    const cleaned = content.replace(/\s/g, '');
    
    // Verificar padrão base64 e tamanho
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(cleaned) && 
           cleaned.length % 4 === 0 && 
           cleaned.length > 100;
  }

  /**
   * Detecta o tipo de mídia com melhor precisão
   */
  private static detectMediaType(content: string, messageType?: string): MediaResult['type'] {
    // Mapear tipos de mensagem
    const typeMapping: Record<string, MediaResult['type']> = {
      'image': 'image',
      'imageMessage': 'image',
      'audio': 'audio', 
      'audioMessage': 'audio',
      'ptt': 'audio',
      'voice': 'audio',
      'video': 'video',
      'videoMessage': 'video',
      'document': 'document',
      'documentMessage': 'document',
      'file': 'document',
      'sticker': 'sticker',
      'stickerMessage': 'sticker'
    };

    // Usar messageType se fornecido e válido
    if (messageType && typeMapping[messageType]) {
      console.log('🎯 [MEDIA_PROCESSOR] Tipo detectado via messageType:', messageType, '->', typeMapping[messageType]);
      return typeMapping[messageType];
    }

    // Detectar por data URL
    if (content.startsWith('data:')) {
      const mimeMatch = content.match(/data:([^;,]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1].toLowerCase();
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('application/')) return 'document';
      }
    }

    // Detectar por assinatura base64
    if (this.looksLikeBase64(content)) {
      const signature = content.substring(0, 20);
      
      // Assinaturas de imagem
      if (signature.includes('/9j/') || signature.includes('iVBOR') || 
          signature.includes('R0lGO') || signature.includes('UklGR')) {
        return 'image';
      }
      
      // Assinaturas de áudio
      if (signature.includes('SUQz') || signature.includes('//uQ') || 
          signature.includes('//sw') || signature.includes('T2dn')) {
        return 'audio';
      }
      
      // Assinaturas de vídeo
      if (signature.includes('AAAAGG') || signature.includes('AAAAFG') || 
          signature.includes('AAAAHG') || signature.includes('ftypmp4')) {
        return 'video';
      }
      
      // Assinaturas de documento
      if (signature.includes('JVBERi')) {
        return 'document';
      }
    }

    return 'text';
  }

  /**
   * Limpa e valida base64
   */
  private static cleanBase64(content: string): { isValid: boolean; cleaned: string; error?: string } {
    try {
      let cleaned = content.replace(/\s/g, '');
      
      // Verificar caracteres válidos
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
        return { isValid: false, cleaned: '', error: 'Caracteres inválidos' };
      }
      
      // Adicionar padding se necessário
      while (cleaned.length % 4 !== 0) {
        cleaned += '=';
      }
      
      // Testar decodificação
      atob(cleaned.substring(0, 100));
      
      return { isValid: true, cleaned };
    } catch (error) {
      return { 
        isValid: false, 
        cleaned: '', 
        error: error instanceof Error ? error.message : 'Erro na validação' 
      };
    }
  }

  /**
   * Calcula tamanho do arquivo
   */
  private static calculateSize(content: string): string {
    try {
      let base64Data = content;
      if (content.startsWith('data:')) {
        const parts = content.split(',');
        base64Data = parts[1] || '';
      }
      
      const bytes = (base64Data.length * 3) / 4;
      
      if (bytes < 1024) return `${Math.round(bytes)} B`;
      if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
      return `${Math.round(bytes / (1024 * 1024))} MB`;
    } catch {
      return 'Tamanho desconhecido';
    }
  }

  /**
   * Retorna MIME type padrão para cada tipo
   */
  private static getDefaultMimeType(type: string): string {
    const defaults = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'document': 'application/pdf',
      'sticker': 'image/webp'
    };
    return defaults[type as keyof typeof defaults] || 'application/octet-stream';
  }

  /**
   * Retorna ícone baseado no tipo
   */
  static getMediaIcon(type: MediaResult['type']): string {
    const icons = {
      image: '🖼️',
      audio: '🎵',
      video: '🎬',
      document: '📎',
      sticker: '🎭',
      text: '💬'
    };
    return icons[type] || '📁';
  }

  /**
   * Verifica se é tipo de mídia
   */
  static isMediaType(type: string): boolean {
    return ['image', 'audio', 'video', 'document', 'sticker'].includes(type);
  }
}
