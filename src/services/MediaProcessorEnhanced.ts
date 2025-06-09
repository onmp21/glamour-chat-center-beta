
export class MediaProcessorEnhanced {
  // Método melhorado para processar mídia
  static processMedia(content: string, messageType: string): { url: string; type: string; isProcessed: boolean } {
    console.log('🔄 [MEDIA_PROCESSOR_ENHANCED] Processando mídia:', { 
      messageType, 
      contentLength: content?.length || 0,
      isDataUrl: content?.startsWith('data:') || false
    });
    
    // Se o conteúdo estiver vazio, retornar erro
    if (!content || content.trim() === '') {
      console.error('❌ [MEDIA_PROCESSOR_ENHANCED] Conteúdo vazio');
      return {
        url: '[Erro: Conteúdo vazio]',
        type: 'error',
        isProcessed: false
      };
    }
    
    // Se já é data URL, verificar se é válido
    if (content.startsWith('data:')) {
      // Verificar se o data URL está completo (tem a parte base64)
      if (!content.includes('base64,')) {
        console.error('❌ [MEDIA_PROCESSOR_ENHANCED] Data URL inválido (sem base64)');
        return {
          url: '[Erro: Data URL inválido]',
          type: 'error',
          isProcessed: false
        };
      }
      
      // Extrair o tipo MIME do data URL
      const mimeMatch = content.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'unknown';
      
      // Determinar o tipo de mídia com base no MIME
      let mediaType = 'unknown';
      if (mimeType.startsWith('image/')) mediaType = 'image';
      else if (mimeType.startsWith('audio/')) mediaType = 'audio';
      else if (mimeType.startsWith('video/')) mediaType = 'video';
      else if (mimeType.startsWith('application/')) mediaType = 'document';
      
      console.log('✅ [MEDIA_PROCESSOR_ENHANCED] Data URL válido:', { mimeType, mediaType });
      
      return {
        url: content,
        type: mediaType,
        isProcessed: true
      };
    }
    
    // Para tipos de mídia, tentar detectar se é base64 puro
    if (this.looksLikeBase64(content)) {
      console.log('🔍 [MEDIA_PROCESSOR_ENHANCED] Conteúdo parece ser base64, tentando converter');
      
      // Determinar o tipo de mídia
      let detectedType = this.detectMediaTypeFromBase64(content);
      if (detectedType === 'unknown' && messageType !== 'text') {
        // Se não conseguiu detectar mas o tipo foi especificado, usar o tipo especificado
        detectedType = messageType;
      }
      
      // Se ainda é desconhecido, tentar inferir pelo tamanho
      if (detectedType === 'unknown') {
        if (content.length < 100000) detectedType = 'audio';
        else if (content.length < 500000) detectedType = 'image';
        else detectedType = 'video';
      }
      
      // Determinar o MIME type com base no tipo detectado
      let mimeType = 'application/octet-stream';
      if (detectedType === 'image') mimeType = 'image/jpeg';
      else if (detectedType === 'audio') mimeType = 'audio/mpeg';
      else if (detectedType === 'video') mimeType = 'video/mp4';
      else if (detectedType === 'document') mimeType = 'application/pdf';
      
      // Limpar o base64 antes de converter
      const cleanResult = this.validateAndCleanBase64(content);
      if (!cleanResult.isValid) {
        console.error('❌ [MEDIA_PROCESSOR_ENHANCED] Base64 inválido:', cleanResult.error);
        return {
          url: '[Erro: Base64 inválido]',
          type: 'error',
          isProcessed: false
        };
      }
      
      // Criar data URL
      const dataUrl = `data:${mimeType};base64,${cleanResult.cleanedContent}`;
      
      console.log('✅ [MEDIA_PROCESSOR_ENHANCED] Base64 convertido com sucesso para:', detectedType);
      
      return {
        url: dataUrl,
        type: detectedType,
        isProcessed: true
      };
    }
    
    // Se chegou aqui, é texto ou formato não reconhecido
    console.log('📝 [MEDIA_PROCESSOR_ENHANCED] Tratando como texto');
    return {
      url: content,
      type: 'text',
      isProcessed: false
    };
  }
  
  // Método para verificar se parece base64
  static looksLikeBase64(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // Verificar se é uma string Base64 válida
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const cleanContent = content.replace(/\s/g, '');
    
    return base64Regex.test(cleanContent) && cleanContent.length % 4 === 0;
  }
  
  // Método para detectar o tipo de mídia a partir do base64 (melhorado)
  static detectMediaTypeFromBase64(content: string): string {
    try {
      // Remover espaços e quebras de linha
      const cleaned = content.replace(/\s/g, '');
      
      // Verificar assinaturas comuns em base64
      // JPEG: /9j/
      if (cleaned.startsWith('/9j/')) return 'image';
      
      // PNG: iVBOR
      if (cleaned.startsWith('iVBOR')) return 'image';
      
      // PDF: JVBERi
      if (cleaned.startsWith('JVBERi')) return 'document';
      
      // MP3/Audio: SUQz ou ID3 ou //uQ
      if (cleaned.startsWith('SUQz') || cleaned.startsWith('//uQ') || cleaned.startsWith('ID3')) return 'audio';
      
      // MP4/Video: AAAAGG ou AAAAHG ou AAAAFG
      if (cleaned.startsWith('AAAAGG') || cleaned.startsWith('AAAAHG') || cleaned.startsWith('AAAAFG')) return 'video';
      
      // WebP: UklGR
      if (cleaned.startsWith('UklGR')) return 'image';
      
      // GIF: R0lGO
      if (cleaned.startsWith('R0lGO')) return 'image';
      
      // OGG Audio: T2dn
      if (cleaned.startsWith('T2dn')) return 'audio';
      
      // WAV Audio: UklGR (diferente do WebP pelo contexto)
      if (cleaned.startsWith('UklGR') && cleaned.length > 1000) return 'audio';
      
    } catch (error) {
      console.warn('🔍 [MEDIA_PROCESSOR_ENHANCED] Erro ao detectar tipo de mídia:', error);
    }
    
    return 'unknown';
  }
  
  // Método para validar e limpar base64
  static validateAndCleanBase64(content: string): { isValid: boolean; cleanedContent?: string; error?: string } {
    try {
      const cleaned = content.replace(/\s/g, '');
      
      // Verificar se é base64 válido
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
        return { isValid: false, error: 'Caracteres inválidos no base64' };
      }
      
      if (cleaned.length % 4 !== 0) {
        return { isValid: false, error: 'Comprimento inválido do base64' };
      }
      
      return { isValid: true, cleanedContent: cleaned };
    } catch (error) {
      return { isValid: false, error: `Erro na validação: ${error}` };
    }
  }
}
