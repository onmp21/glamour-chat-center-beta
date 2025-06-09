
import { Base64Utils } from './base64Utils';

export interface MediaProcessingResult {
  success: boolean;
  dataUrl?: string;
  mimeType?: string;
  size?: string;
  error?: string;
  originalFormat?: string;
}

export class MediaProcessorUnified {
  static process(content: string, messageType?: string): MediaProcessingResult {
    console.log('🔄 [MEDIA_UNIFIED] Starting processing:', {
      contentLength: content?.length || 0,
      messageType,
      startsWithData: content?.startsWith('data:'),
      firstChars: content?.substring(0, 50)
    });

    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.error('❌ [MEDIA_UNIFIED] Empty or invalid content');
      return { success: false, error: 'Conteúdo vazio ou inválido' };
    }

    // Se já é data URL válida
    if (content.startsWith('data:')) {
      console.log('✅ [MEDIA_UNIFIED] Already a data URL');
      return this.validateDataUrl(content);
    }

    // Se parece ser base64
    if (this.isLikelyBase64(content)) {
      console.log('🔍 [MEDIA_UNIFIED] Processing as base64');
      return this.processBase64(content, messageType);
    }

    // Texto normal
    console.log('📝 [MEDIA_UNIFIED] Treating as text');
    return { success: false, error: 'Conteúdo não é mídia válida' };
  }

  private static validateDataUrl(dataUrl: string): MediaProcessingResult {
    try {
      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        return { success: false, error: 'Data URL malformada' };
      }

      const [header, base64Data] = parts;
      const mimeMatch = header.match(/data:([^;]+)/);
      let mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

      // Corrigir MIME type para application/octet-stream baseado no conteúdo
      if (mimeType === 'application/octet-stream') {
        const detectedMime = Base64Utils.detectMimeType(base64Data);
        if (detectedMime !== 'application/octet-stream') {
          mimeType = detectedMime;
          // Atualizar a data URL com o MIME type correto
          dataUrl = `data:${mimeType};base64,${base64Data}`;
        }
      }

      // Validar base64
      if (!Base64Utils.isValidBase64(base64Data)) {
        return { success: false, error: 'Base64 inválido na data URL' };
      }

      const size = Base64Utils.getBase64Size(dataUrl);
      
      console.log('✅ [MEDIA_UNIFIED] Data URL válida:', { mimeType, size });
      
      return {
        success: true,
        dataUrl,
        mimeType,
        size,
        originalFormat: 'data-url'
      };
    } catch (error) {
      console.error('❌ [MEDIA_UNIFIED] Erro validando data URL:', error);
      return { success: false, error: `Erro na validação: ${error}` };
    }
  }

  private static processBase64(content: string, messageType?: string): MediaProcessingResult {
    try {
      // IMPORTANTE: NÃO alterar o base64 original para preservar integridade
      let cleanBase64 = content.trim();
      
      // Apenas remover quebras de linha, mantendo estrutura
      cleanBase64 = cleanBase64.replace(/[\r\n]/g, '');
      
      // Validar
      if (!Base64Utils.isValidBase64(cleanBase64)) {
        console.warn('⚠️ [MEDIA_UNIFIED] Base64 pode estar corrompido, tentando preservar');
      }

      // Detectar MIME type
      let mimeType = Base64Utils.detectMimeType(cleanBase64);
      
      // Usar messageType como fallback
      if (mimeType === 'application/octet-stream' && messageType) {
        mimeType = this.getDefaultMimeType(messageType);
      }

      // Criar data URL preservando o base64 original
      const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
      const size = Base64Utils.getBase64Size(dataUrl);

      console.log('✅ [MEDIA_UNIFIED] Base64 processado sem alteração:', { mimeType, size });

      return {
        success: true,
        dataUrl,
        mimeType,
        size,
        originalFormat: 'base64'
      };
    } catch (error) {
      console.error('❌ [MEDIA_UNIFIED] Erro processando base64:', error);
      return { success: false, error: `Erro no processamento: ${error}` };
    }
  }

  private static isLikelyBase64(content: string): boolean {
    if (!content || content.length < 100) return false;
    
    const cleaned = content.replace(/[\r\n]/g, ''); // Apenas quebras de linha
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    return base64Regex.test(cleaned) && 
           cleaned.length % 4 === 0 && 
           cleaned.length > 100;
  }

  private static getDefaultMimeType(messageType: string): string {
    const defaults: Record<string, string> = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'document': 'application/pdf',
      'sticker': 'image/webp'
    };
    return defaults[messageType] || 'application/octet-stream';
  }

  // Método específico para QR Code - SEM ALTERAR O BASE64
  static processQRCode(qrData: string): MediaProcessingResult {
    console.log('🔍 [QR_PROCESSOR] Processing QR Code sem alterar dados');
    
    if (!qrData || typeof qrData !== 'string') {
      return { success: false, error: 'Dados do QR Code inválidos' };
    }

    // Se já é data URL, retornar como está
    if (qrData.startsWith('data:image/')) {
      return { success: true, dataUrl: qrData };
    }

    // Se é data URL sem tipo específico, assumir PNG
    if (qrData.startsWith('data:')) {
      const correctedUrl = qrData.replace(/^data:[^;]*/, 'data:image/png');
      return { success: true, dataUrl: correctedUrl };
    }

    // Para base64 puro, apenas adicionar header sem alterar conteúdo
    const dataUrl = `data:image/png;base64,${qrData}`;
    
    console.log('✅ [QR_PROCESSOR] QR Code processado preservando dados originais');
    return { success: true, dataUrl };
  }

  // Método específico para mídias do WhatsApp - PRESERVAR INTEGRIDADE
  static processWhatsAppMedia(content: string, messageType?: string): MediaProcessingResult {
    console.log('📱 [WHATSAPP_MEDIA] Processing WhatsApp media preservando integridade');

    // Processar sem alterar o base64 original
    const result = this.process(content, messageType);
    
    if (result.success && result.mimeType === 'application/octet-stream') {
      // Para mídias do WhatsApp, corrigir apenas o MIME type
      let correctedMimeType = result.mimeType;
      
      if (messageType) {
        switch (messageType.toLowerCase()) {
          case 'audio':
          case 'audiomessage':
            correctedMimeType = 'audio/ogg'; // WhatsApp usa OGG para áudio
            break;
          case 'image':
          case 'imagemessage':
            correctedMimeType = 'image/jpeg'; // Padrão para imagens
            break;
          case 'video':
          case 'videomessage':
            correctedMimeType = 'video/mp4'; // Padrão para vídeos
            break;
          case 'document':
          case 'documentmessage':
            correctedMimeType = 'application/pdf'; // Padrão para documentos
            break;
          case 'sticker':
          case 'stickermessage':
            correctedMimeType = 'image/webp'; // WhatsApp usa WebP para stickers
            break;
        }
        
        if (correctedMimeType !== result.mimeType) {
          result.mimeType = correctedMimeType;
          result.dataUrl = result.dataUrl?.replace('application/octet-stream', correctedMimeType);
          console.log('🔧 [WHATSAPP_MEDIA] MIME type corrigido para:', correctedMimeType);
        }
      }
    }
    
    return result;
  }
}
