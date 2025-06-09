
export class MediaDetector {
  static isMediaType(messageType: string): boolean {
    const mediaTypes = ['image', 'audio', 'video', 'document'];
    return mediaTypes.includes(messageType);
  }

  static looksLikeBase64(content: string): boolean {
    if (!content || content.length < 100) return false;
    
    // Limpar espaços e quebras de linha
    const cleaned = content.replace(/[\s\n\r\t]/g, '');
    
    // Verificar padrão base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    // Deve ser múltiplo de 4 e passar no regex
    return base64Regex.test(cleaned) && cleaned.length % 4 === 0;
  }

  static detectMediaTypeFromBase64(base64Content: string): string {
    try {
      // Pegar os primeiros caracteres para detectar assinaturas
      const header = base64Content.substring(0, 20);
      
      console.log('🔍 [MEDIA_DETECTOR] Analyzing header:', header);
      
      // Assinaturas conhecidas em base64
      const signatures = [
        { pattern: '/9j/', type: 'image' },           // JPEG
        { pattern: 'iVBOR', type: 'image' },          // PNG
        { pattern: 'R0lGO', type: 'image' },          // GIF
        { pattern: 'UklGR', type: 'image' },          // WebP
        { pattern: 'JVBERi', type: 'document' },      // PDF
        { pattern: 'SUQz', type: 'audio' },           // MP3 com ID3
        { pattern: '//uQ', type: 'audio' },           // MP3
        { pattern: '//sw', type: 'audio' },           // MP3 alternativo
        { pattern: 'T2dn', type: 'audio' },           // OGG
        { pattern: 'AAAAGG', type: 'video' },         // MP4
        { pattern: 'AAAAFG', type: 'video' },         // MP4 alternativo
        { pattern: 'AAAAHG', type: 'video' },         // MP4 outro
        { pattern: 'ftypmp4', type: 'video' },        // MP4 com ftyp
      ];
      
      for (const sig of signatures) {
        if (header.includes(sig.pattern)) {
          console.log(`✅ [MEDIA_DETECTOR] Detected ${sig.type} from signature: ${sig.pattern}`);
          return sig.type;
        }
      }
      
      console.log('❓ [MEDIA_DETECTOR] No signature matched, returning unknown');
      return 'unknown';
      
    } catch (error) {
      console.error('❌ [MEDIA_DETECTOR] Error detecting type:', error);
      return 'unknown';
    }
  }

  static isPlaceholderText(content: string): boolean {
    const placeholders = [
      '[Conteúdo vazio]',
      '[Base64 inválido]',
      '[Data URL inválido]',
      '[Erro:',
      '[Mídia não suportada]',
      '[Carregando...]'
    ];
    
    return placeholders.some(placeholder => content.includes(placeholder));
  }
}
