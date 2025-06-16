
export class MediaDownloadService {
  static async downloadMedia(mediaUrl: string, fileName?: string): Promise<void> {
    try {
      // Verificar se é URL do storage público
      if (!mediaUrl.startsWith('https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/')) {
        throw new Error('URL de mídia inválida');
      }

      console.log('📥 [MEDIA_DOWNLOAD] Iniciando download:', mediaUrl);

      const response = await fetch(mediaUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar mídia: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Detectar tipo de arquivo e extensão
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const extension = this.getExtensionFromMimeType(contentType);
      
      // Gerar nome do arquivo se não fornecido
      const finalFileName = fileName || `media_${Date.now()}${extension}`;
      
      // Criar link de download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalFileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ [MEDIA_DOWNLOAD] Download concluído:', finalFileName);
      
    } catch (error) {
      console.error('❌ [MEDIA_DOWNLOAD] Erro no download:', error);
      throw error;
    }
  }

  private static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'application/pdf': '.pdf'
    };
    return mimeToExt[mimeType] || '.bin';
  }

  static isDownloadableMedia(mediaUrl: string): boolean {
    return mediaUrl && mediaUrl.startsWith('https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/');
  }
}
