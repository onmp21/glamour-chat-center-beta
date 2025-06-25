
/**
 * Utilidades simplificadas para base64 - APENAS para QR Codes
 */
export class Base64Utils {
  /**
   * Verifica se uma string é um base64 válido
   */
  static isValidBase64(str: string): boolean {
    if (!str || typeof str !== 'string') {
      return false;
    }

    // Remover espaços e quebras de linha
    const cleaned = str.replace(/\s/g, '');
    
    // Verificar se já é data URL
    if (cleaned.startsWith('data:')) {
      const base64Part = cleaned.split(',')[1];
      if (!base64Part) return false;
      return this.isValidBase64Raw(base64Part);
    }

    return this.isValidBase64Raw(cleaned);
  }

  /**
   * Verifica se é um base64 puro (sem data: prefix)
   */
  private static isValidBase64Raw(str: string): boolean {
    // Verificar tamanho mínimo
    if (str.length < 4) return false;
    
    // Verificar caracteres válidos
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;
    
    // Verificar padding
    const paddingCount = (str.match(/=/g) || []).length;
    if (paddingCount > 2) return false;
    
    // Se tem padding, deve estar no final
    if (paddingCount > 0 && !str.endsWith('='.repeat(paddingCount))) {
      return false;
    }
    
    return true;
  }

  /**
   * Detecta o tipo MIME baseado na assinatura do base64 - APENAS para QR codes
   */
  static detectMimeType(base64Content: string): string {
    // Extrair apenas o conteúdo base64 se for data URL
    let cleanBase64 = base64Content;
    if (base64Content.startsWith('data:')) {
      const parts = base64Content.split(',');
      if (parts.length > 1) {
        cleanBase64 = parts[1];
      }
    }

    // Remover espaços e quebras
    cleanBase64 = cleanBase64.replace(/\s/g, '');

    // Para QR codes, geralmente PNG
    if (cleanBase64.startsWith('iVBORw')) return 'image/png';
    if (cleanBase64.startsWith('/9j/')) return 'image/jpeg';
    
    // Default para QR codes
    return 'image/png';
  }

  /**
   * Processa especificamente QR codes vindos da API Evolution
   */
  static processQRCode(qrData: string): { isValid: boolean; dataUrl?: string; error?: string } {
    try {
      if (!qrData || typeof qrData !== 'string') {
        return { isValid: false, error: 'Dados do QR Code inválidos' };
      }

      console.log('🔍 [QR_PROCESSOR] Processando QR Code:', qrData.substring(0, 50) + '...');

      // Se já é uma data URL válida para imagem
      if (qrData.startsWith('data:image/')) {
        return { isValid: true, dataUrl: qrData };
      }

      // Se é data URL genérica, assumir PNG
      if (qrData.startsWith('data:')) {
        const correctedUrl = qrData.replace(/^data:[^;]*/, 'data:image/png');
        return { isValid: true, dataUrl: correctedUrl };
      }

      // Se é base64 puro, processar
      const cleanBase64 = qrData.replace(/\s/g, '');
      
      if (!this.isValidBase64Raw(cleanBase64)) {
        return { isValid: false, error: 'Base64 inválido para QR Code' };
      }

      // Para QR codes, assumir PNG por padrão
      const dataUrl = `data:image/png;base64,${cleanBase64}`;
      
      console.log('✅ [QR_PROCESSOR] QR Code processado com sucesso');
      return { isValid: true, dataUrl };
      
    } catch (error) {
      console.error('❌ [QR_PROCESSOR] Erro:', error);
      return { isValid: false, error: `Erro ao processar QR Code: ${error}` };
    }
  }
}
