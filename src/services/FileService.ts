
import { AudioConverter } from './AudioConverter';

export class FileService {
  static async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static async convertAudioToMp3Base64(file: File): Promise<string> {
    try {
      console.log('🎵 [FILE_SERVICE] Converting audio to MP3...');
      
      // Convert file to blob first
      const audioBlob = new Blob([file], { type: file.type });
      
      // Use AudioConverter to convert to MP3
      const mp3Base64 = await AudioConverter.audioToBase64Mp3(audioBlob);
      
      console.log('✅ [FILE_SERVICE] Audio converted to MP3 successfully');
      return mp3Base64;
    } catch (error) {
      console.error('❌ [FILE_SERVICE] Error converting audio to MP3:', error);
      // Fallback to regular base64 conversion
      return this.convertToBase64(file);
    }
  }

  static getFileType(mimeType: string): 'document' | 'audio' | 'image' | 'video' {
    if (AudioConverter.isAudioFormat(mimeType) || mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Audio - expanded list
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
      'audio/aac',
      // Video
      'video/mp4',
      'video/webm'
    ];
    return allowedTypes.includes(file.type) || AudioConverter.isAudioFormat(file.type);
  }

  static getUnsupportedFileMessage(file: File): string {
    if (file.type.startsWith('audio/') && !this.isValidFileType(file)) {
      return `Formato de áudio "${file.type}" não suportado. Use: MP3, WAV, OGG, WebM, M4A ou AAC.`;
    }
    
    if (file.type.startsWith('image/') && !this.isValidFileType(file)) {
      return `Formato de imagem "${file.type}" não suportado. Use: JPEG, PNG, GIF ou WebP.`;
    }
    
    if (file.type.startsWith('video/') && !this.isValidFileType(file)) {
      return `Formato de vídeo "${file.type}" não suportado. Use: MP4 ou WebM.`;
    }
    
    return `Tipo de arquivo "${file.type}" não suportado. Verifique os formatos permitidos.`;
  }
}
