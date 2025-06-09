
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
   * Formata uma string base64 para garantir formato correto SEM CORRUPÇÃO
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

      // Limpar base64 CUIDADOSAMENTE para não corromper
      let cleanBase64 = base64Content.trim(); // Apenas trim, não remover todos os espaços
      
      // Remover apenas quebras de linha e espaços no início/fim
      cleanBase64 = cleanBase64.replace(/[\r\n]/g, '');
      
      // Verificar se é base64 válido
      if (!this.isValidBase64Raw(cleanBase64)) {
        return { isValid: false, error: 'Base64 inválido' };
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
   * Extrai apenas o conteúdo base64 de uma data URL sem corromper
   */
  static extractBase64Content(dataUrl: string): string {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      return parts.length > 1 ? parts[1] : '';
    }
    return dataUrl;
  }

  /**
   * Processa base64 para envio via Evolution API (sem corrupção)
   */
  static prepareForEvolutionApi(base64Content: string): string {
    // Se já é data URL, extrair apenas o base64
    let cleanBase64 = this.extractBase64Content(base64Content);
    
    // Remover apenas quebras de linha (preservar estrutura do base64)
    cleanBase64 = cleanBase64.replace(/[\r\n]/g, '');
    
    // Verificar se precisa de padding (mas com cuidado)
    const remainder = cleanBase64.length % 4;
    if (remainder !== 0) {
      const paddingNeeded = 4 - remainder;
      cleanBase64 += '='.repeat(paddingNeeded);
    }
    
    return cleanBase64;
  }

  /**
   * Processa base64 recebido via WebSocket (preservar integridade)
   */
  static processReceivedBase64(base64Content: string, mediaType: string): string {
    try {
      // Extrair base64 se for data URL
      let cleanBase64 = this.extractBase64Content(base64Content);
      
      // Limpar apenas caracteres problemáticos (não o conteúdo)
      cleanBase64 = cleanBase64.replace(/[\r\n\t]/g, '');
      
      // Validar antes de processar
      if (!this.isValidBase64Raw(cleanBase64)) {
        console.warn('⚠️ [BASE64_UTILS] Base64 recebido pode estar corrompido');
        // Não retornar erro, tentar preservar o máximo possível
      }
      
      // Determinar MIME type
      const mimeType = this.getMimeTypeForMediaType(mediaType);
      
      return `data:${mimeType};base64,${cleanBase64}`;
    } catch (error) {
      console.error('❌ [BASE64_UTILS] Erro ao processar base64 recebido:', error);
      // Em caso de erro, retornar conteúdo original
      return base64Content;
    }
  }

  private static getMimeTypeForMediaType(mediaType: string): string {
    switch (mediaType.toLowerCase()) {
      case 'image': return 'image/jpeg';
      case 'audio': return 'audio/mpeg';
      case 'video': return 'video/mp4';
      case 'document': return 'application/pdf';
      case 'sticker': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }

  /**
   * Baixa um arquivo base64 - VERSÃO MELHORADA
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
      
      // Converter para blob SEM CORROMPER
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

  /**
   * Valida integridade do base64 antes do envio
   */
  static validateIntegrity(base64Content: string): { isValid: boolean; canSend: boolean; error?: string } {
    try {
      const cleanBase64 = this.extractBase64Content(base64Content);
      
      // Verificar se não está vazio
      if (!cleanBase64 || cleanBase64.length < 4) {
        return { isValid: false, canSend: false, error: 'Base64 vazio ou muito pequeno' };
      }
      
      // Verificar caracteres válidos
      const isValid = this.isValidBase64Raw(cleanBase64);
      
      // Verificar tamanho (limite razoável)
      const sizeInBytes = (cleanBase64.length * 3) / 4;
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (sizeInBytes > maxSize) {
        return { isValid: true, canSend: false, error: 'Arquivo muito grande (>50MB)' };
      }
      
      return { 
        isValid, 
        canSend: isValid, 
        error: isValid ? undefined : 'Base64 inválido ou corrompido' 
      };
    } catch (error) {
      return { isValid: false, canSend: false, error: `Erro na validação: ${error}` };
    }
  }
}
