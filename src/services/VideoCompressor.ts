export interface VideoCompressionOptions {
  quality: number; // 0.1 to 1.0
  maxSizeKB: number;
  maxWidth?: number;
  maxHeight?: number;
  frameRate?: number;
  format?: 'mp4' | 'webm';
}

export interface VideoCompressionResult {
  success: boolean;
  compressedData?: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

export class VideoCompressor {
  /**
   * Comprime vídeo para otimizar envio via WhatsApp
   */
  static async compressVideo(
    videoData: string,
    options: VideoCompressionOptions = { 
      quality: 0.6, 
      maxSizeKB: 15 * 1024, // 15MB máximo para WhatsApp
      maxWidth: 1280,
      maxHeight: 720,
      frameRate: 30,
      format: 'mp4'
    },
    onProgress?: (progress: number) => void
  ): Promise<VideoCompressionResult> {
    try {
      console.log('🎬 [VIDEO_COMPRESSOR] Iniciando compressão:', {
        originalSize: videoData.length,
        targetFormat: options.format,
        quality: options.quality,
        maxSizeKB: options.maxSizeKB
      });

      const originalSize = videoData.length;
      onProgress?.(10);

      // Verificar se já está em tamanho aceitável
      const currentSizeKB = (originalSize * 3) / 4 / 1024;
      if (currentSizeKB <= options.maxSizeKB) {
        console.log('✅ [VIDEO_COMPRESSOR] Vídeo já está em tamanho aceitável');
        onProgress?.(100);
        return {
          success: true,
          compressedData: videoData,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1.0
        };
      }

      onProgress?.(20);

      // Converter base64 para blob
      const videoBlob = this.base64ToBlob(videoData);
      if (!videoBlob) {
        throw new Error('Falha ao converter base64 para blob');
      }

      onProgress?.(30);

      // Comprimir usando canvas e MediaRecorder
      const compressedBlob = await this.compressVideoBlob(videoBlob, options, (progress) => {
        onProgress?.(30 + (progress * 0.6)); // 30% a 90%
      });

      onProgress?.(90);

      const compressedData = await this.blobToBase64(compressedBlob);
      const compressedSize = compressedData.length;
      const compressionRatio = compressedSize / originalSize;

      onProgress?.(100);

      console.log('✅ [VIDEO_COMPRESSOR] Compressão concluída:', {
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
      console.error('❌ [VIDEO_COMPRESSOR] Erro na compressão:', error);
      onProgress?.(0);
      return {
        success: false,
        originalSize: videoData.length,
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
      let mimeType = 'video/mp4';

      if (base64Data.startsWith('data:')) {
        const parts = base64Data.split(',');
        const header = parts[0];
        data = parts[1];
        
        const mimeMatch = header.match(/data:([^;,]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('❌ [VIDEO_COMPRESSOR] Erro ao converter base64:', error);
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
   * Comprime blob de vídeo usando canvas e MediaRecorder
   */
  private static async compressVideoBlob(
    videoBlob: Blob,
    options: VideoCompressionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      video.onloadedmetadata = () => {
        try {
          // Calcular dimensões mantendo aspect ratio
          const { width, height } = this.calculateDimensions(
            video.videoWidth,
            video.videoHeight,
            options.maxWidth || 1280,
            options.maxHeight || 720
          );

          canvas.width = width;
          canvas.height = height;

          // Configurar MediaRecorder
          const stream = canvas.captureStream(options.frameRate || 30);
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: `video/${options.format || 'mp4'}`,
            videoBitsPerSecond: this.calculateBitrate(width, height, options.quality)
          });

          const chunks: Blob[] = [];
          let currentTime = 0;
          const duration = video.duration;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const compressedBlob = new Blob(chunks, { type: `video/${options.format || 'mp4'}` });
            resolve(compressedBlob);
          };

          mediaRecorder.onerror = (event) => {
            reject(new Error('Erro no MediaRecorder: ' + event));
          };

          // Iniciar gravação
          mediaRecorder.start();

          // Função para processar frames
          const processFrame = () => {
            if (currentTime >= duration) {
              mediaRecorder.stop();
              return;
            }

            video.currentTime = currentTime;
            
            video.onseeked = () => {
              // Desenhar frame no canvas com qualidade reduzida
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'medium';
              ctx.drawImage(video, 0, 0, width, height);

              // Atualizar progresso
              const progress = (currentTime / duration) * 100;
              onProgress?.(progress);

              // Próximo frame
              currentTime += 1 / (options.frameRate || 30);
              setTimeout(processFrame, 1000 / (options.frameRate || 30));
            };
          };

          // Iniciar processamento
          video.currentTime = 0;
          processFrame();

        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Erro ao carregar vídeo'));
      };

      video.src = URL.createObjectURL(videoBlob);
      video.load();
    });
  }

  /**
   * Calcula dimensões mantendo aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    // Garantir que sejam números pares (melhor para codificação)
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    return { width, height };
  }

  /**
   * Calcula bitrate baseado nas dimensões e qualidade
   */
  private static calculateBitrate(width: number, height: number, quality: number): number {
    const pixels = width * height;
    const baseBitrate = pixels * 0.1; // Base: 0.1 bits por pixel
    return Math.floor(baseBitrate * quality);
  }

  /**
   * Valida se o vídeo está em formato adequado para WhatsApp
   */
  static validateVideoForWhatsApp(videoData: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Verificar tamanho (máximo 16MB para WhatsApp)
    const sizeKB = (videoData.length * 3) / 4 / 1024;
    if (sizeKB > 16 * 1024) {
      issues.push(`Arquivo muito grande: ${Math.round(sizeKB)}KB (máximo 16MB)`);
    }

    // Verificar formato
    if (videoData.startsWith('data:')) {
      const mimeMatch = videoData.match(/data:([^;,]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        const supportedFormats = ['video/mp4', 'video/webm', 'video/3gpp'];
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
   * Extrai thumbnail do vídeo
   */
  static async extractThumbnail(videoData: string): Promise<string | null> {
    try {
      const videoBlob = this.base64ToBlob(videoData);
      if (!videoBlob) return null;

      return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(null);
          return;
        }

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          video.currentTime = 1; // Pegar frame do segundo 1
        };

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        };

        video.onerror = () => resolve(null);
        video.src = URL.createObjectURL(videoBlob);
        video.load();
      });
    } catch (error) {
      console.error('❌ [VIDEO_COMPRESSOR] Erro ao extrair thumbnail:', error);
      return null;
    }
  }

  /**
   * Estima duração do vídeo
   */
  static async estimateVideoDuration(videoData: string): Promise<number | null> {
    try {
      const videoBlob = this.base64ToBlob(videoData);
      if (!videoBlob) return null;

      return new Promise((resolve) => {
        const video = document.createElement('video');
        
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };

        video.onerror = () => resolve(null);
        video.src = URL.createObjectURL(videoBlob);
        video.load();
      });
    } catch (error) {
      console.error('❌ [VIDEO_COMPRESSOR] Erro ao estimar duração:', error);
      return null;
    }
  }
}

