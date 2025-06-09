
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
   * Detecta o tipo MIME baseado na assinatura do base64
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

    // Detectar por assinatura - ordem otimizada para QR codes
    if (cleanBase64.startsWith('iVBORw')) return 'image/png'; // PNG (comum para QR codes)
    if (cleanBase64.startsWith('/9j/')) return 'image/jpeg';
    if (cleanBase64.startsWith('R0lGO')) return 'image/gif';
    if (cleanBase64.startsWith('UklGR')) return 'image/webp';
    if (cleanBase64.startsWith('Qk0') || cleanBase64.startsWith('Qk1')) return 'image/bmp'; // BMP
    if (cleanBase64.startsWith('JVBERi')) return 'application/pdf';
    if (cleanBase64.startsWith('SUQz') || cleanBase64.startsWith('//uQ') || cleanBase64.startsWith('//sw')) return 'audio/mpeg';
    if (cleanBase64.startsWith('T2dn')) return 'audio/ogg';
    if (cleanBase64.startsWith('AAAAGG') || cleanBase64.startsWith('AAAAFG') || cleanBase64.startsWith('AAAAHG')) return 'video/mp4';
    
    return 'application/octet-stream';
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

  /**
   * Formata uma string base64 para garantir formato correto
   */
  static formatBase64String(base64Content: string): { isValid: boolean; formatted?: string; error?: string } {
    try {
      if (!base64Content || typeof base64Content !== 'string') {
        return { isValid: false, error: 'Conteúdo inválido' };
      }

      // Se já é data URL válida, retornar como está
      if (base64Content.startsWith('data:')) {
        const parts = base64Content.split(',');
        if (parts.length === 2 && this.isValidBase64Raw(parts[1])) {
          return { isValid: true, formatted: base64Content };
        }
        return { isValid: false, error: 'Data URL malformada' };
      }

      // Limpar base64
      let cleanBase64 = base64Content.replace(/\s/g, '');
      
      // Verificar se é base64 válido
      if (!this.isValidBase64Raw(cleanBase64)) {
        return { isValid: false, error: 'Base64 inválido' };
      }

      // Adicionar padding se necessário
      const paddingNeeded = 4 - (cleanBase64.length % 4);
      if (paddingNeeded < 4) {
        cleanBase64 += '='.repeat(paddingNeeded);
      }

      // Detectar MIME type e criar data URL
      const mimeType = this.detectMimeType(cleanBase64);
      const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

      return { isValid: true, formatted: dataUrl };
    } catch (error) {
      return { isValid: false, error: `Erro ao processar: ${error}` };
    }
  }

  /**
   * Extrai apenas o conteúdo base64 de uma data URL
   */
  static extractBase64Content(dataUrl: string): string {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      return parts.length > 1 ? parts[1] : '';
    }
    return dataUrl;
  }

  /**
   * Baixa um arquivo base64 - CORRIGIDO
   */
  static downloadBase64File(dataUrl: string, fileName: string, mimeType?: string): void {
    try {
      console.log('📥 [BASE64_UTILS] Iniciando download:', { fileName, mimeType, hasDataUrl: dataUrl.length > 0 });
      
      // Extrair base64 puro
      const base64Data = this.extractBase64Content(dataUrl);
      
      if (!base64Data) {
        throw new Error('Conteúdo base64 não encontrado');
      }
      
      // Detectar MIME type se não fornecido
      const finalMimeType = mimeType || this.detectMimeType(dataUrl);
      console.log('📥 [BASE64_UTILS] MIME type detectado:', finalMimeType);
      
      // Converter para blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: finalMimeType });

      // Criar URL e baixar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ [BASE64_UTILS] Download iniciado com sucesso');
    } catch (error) {
      console.error('❌ [BASE64_UTILS] Erro ao baixar arquivo:', error);
      throw new Error(`Falha ao baixar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Calcula o tamanho aproximado de um arquivo base64
   */
  static getBase64Size(base64Content: string): string {
    try {
      const base64Data = this.extractBase64Content(base64Content);
      const sizeInBytes = (base64Data.length * 3) / 4;
      
      if (sizeInBytes < 1024) {
        return `${Math.round(sizeInBytes)} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        return `${Math.round(sizeInBytes / 1024)} KB`;
      } else {
        return `${Math.round(sizeInBytes / (1024 * 1024))} MB`;
      }
    } catch (error) {
      return 'Tamanho desconhecido';
    }
  }
}
