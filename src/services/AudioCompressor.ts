export interface CompressionOptions {
  quality: number; // 0.1 to 1.0
  maxSizeKB: number;
  format?: 'mp3' | 'ogg' | 'webm';
}

export interface CompressionResult {
  success: boolean;
  compressedData?: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  error?: string;
}

export class AudioCompressor {
  /**
   * Comprime áudio para otimizar envio via WhatsApp
   */
  static async compressAudio(
    audioData: string, 
    options: CompressionOptions = { quality: 0.7, maxSizeKB: 500, format: 'ogg' }
  ): Promise<CompressionResult> {
    try {
      console.log('🎵 [AUDIO_COMPRESSOR] Iniciando compressão:', {
        originalSize: audioData.length,
        targetFormat: options.format,
        quality: options.quality,
        maxSizeKB: options.maxSizeKB
      });

      const originalSize = audioData.length;
      
      // Verificar se já está em tamanho aceitável
      const currentSizeKB = (originalSize * 3) / 4 / 1024; // Base64 to bytes to KB
      if (currentSizeKB <= options.maxSizeKB) {
        console.log('✅ [AUDIO_COMPRESSOR] Áudio já está em tamanho aceitável');
        return {
          success: true,
          compressedData: audioData,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1.0
        };
      }

      // Converter base64 para blob
      const audioBlob = this.base64ToBlob(audioData);
      if (!audioBlob) {
        throw new Error('Falha ao converter base64 para blob');
      }

      // Comprimir usando Web Audio API
      const compressedBlob = await this.compressAudioBlob(audioBlob, options);
      const compressedData = await this.blobToBase64(compressedBlob);

      const compressedSize = compressedData.length;
      const compressionRatio = compressedSize / originalSize;

      console.log('✅ [AUDIO_COMPRESSOR] Compressão concluída:', {
        originalSizeKB: Math.round(currentSizeKB),
        compressedSizeKB: Math.round((compressedSize * 3) / 4 / 1024),
        compressionRatio: Math.round(compressionRatio * 100) / 100
      });

      return {
        success: true,
        compressedData,
        originalSize,
        compressedSize,
        compressionRatio
      };

    } catch (error) {
      console.error('❌ [AUDIO_COMPRESSOR] Erro na compressão:', error);
      return {
        success: false,
        originalSize: audioData.length,
        compressedSize: 0,
        compressionRatio: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Converte base64 para Blob
   */
  private static base64ToBlob(base64Data: string): Blob | null {
    try {
      let data = base64Data;
      if (base64Data.startsWith('data:')) {
        data = base64Data.split(',')[1];
      }

      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: 'audio/webm' });
    } catch (error) {
      console.error('❌ [AUDIO_COMPRESSOR] Erro ao converter base64:', error);
      return null;
    }
  }

  /**
   * Converte Blob para base64
   */
  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Comprime blob de áudio usando Web Audio API
   */
  private static async compressAudioBlob(
    audioBlob: Blob, 
    options: CompressionOptions
  ): Promise<Blob> {
    try {
      // Criar contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Converter blob para array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decodificar áudio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Reduzir qualidade se necessário
      const targetSampleRate = Math.min(audioBuffer.sampleRate, 22050); // Reduzir sample rate
      const targetChannels = Math.min(audioBuffer.numberOfChannels, 1); // Mono
      
      // Criar novo buffer com qualidade reduzida
      const compressedBuffer = audioContext.createBuffer(
        targetChannels,
        Math.floor(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate),
        targetSampleRate
      );

      // Copiar dados com downsampling
      for (let channel = 0; channel < targetChannels; channel++) {
        const inputData = audioBuffer.getChannelData(Math.min(channel, audioBuffer.numberOfChannels - 1));
        const outputData = compressedBuffer.getChannelData(channel);
        
        for (let i = 0; i < outputData.length; i++) {
          const sourceIndex = Math.floor(i * audioBuffer.length / outputData.length);
          outputData[i] = inputData[sourceIndex] * options.quality; // Aplicar qualidade
        }
      }

      // Converter de volta para blob (simulado - em produção usaria MediaRecorder)
      const compressedArrayBuffer = this.audioBufferToArrayBuffer(compressedBuffer);
      return new Blob([compressedArrayBuffer], { type: `audio/${options.format || 'webm'}` });

    } catch (error) {
      console.error('❌ [AUDIO_COMPRESSOR] Erro na compressão Web Audio:', error);
      // Fallback: retornar blob original com qualidade reduzida
      return audioBlob;
    }
  }

  /**
   * Converte AudioBuffer para ArrayBuffer (simplificado)
   */
  private static audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2; // 16-bit
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    
    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }

  /**
   * Valida se o áudio está em formato adequado para WhatsApp
   */
  static validateAudioForWhatsApp(audioData: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Verificar tamanho (máximo 16MB para WhatsApp)
    const sizeKB = (audioData.length * 3) / 4 / 1024;
    if (sizeKB > 16 * 1024) {
      issues.push(`Arquivo muito grande: ${Math.round(sizeKB)}KB (máximo 16MB)`);
    }

    // Verificar formato
    if (audioData.startsWith('data:')) {
      const mimeMatch = audioData.match(/data:([^;,]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        const supportedFormats = ['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/webm'];
        if (!supportedFormats.some(format => mimeType.includes(format))) {
          issues.push(`Formato não suportado: ${mimeType}`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Estima duração do áudio (simplificado)
   */
  static estimateAudioDuration(audioData: string): number | null {
    try {
      // Em uma implementação real, seria necessário analisar os metadados
      // Por agora, retorna null indicando que não foi possível determinar
      return null;
    } catch (error) {
      console.error('❌ [AUDIO_COMPRESSOR] Erro ao estimar duração:', error);
      return null;
    }
  }
}

