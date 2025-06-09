
export interface FileMetadata {
  name: string;
  extension: string;
  type: 'document' | 'image' | 'audio' | 'video';
  icon: string;
  size?: string;
}

export class FileUtils {
  static getFileIcon(extension: string): string {
    const iconMap: Record<string, string> = {
      // Documentos
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📊',
      'pptx': '📊',
      'txt': '📄',
      'rtf': '📄',
      // Arquivos compactados
      'zip': '🗜️',
      'rar': '🗜️',
      '7z': '🗜️',
      // Outros
      'csv': '📊',
      'json': '📄',
      'xml': '📄',
      // Fallback
      'default': '📎'
    };
    
    return iconMap[extension.toLowerCase()] || iconMap.default;
  }

  static extractFileInfo(content: string, messageType: string = 'text'): FileMetadata {
    // Tentar extrair nome do arquivo de data URLs
    if (content.startsWith('data:')) {
      const mimeMatch = content.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : '';
      
      // Mapear tipos MIME para extensões
      const mimeToExt: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'text/plain': 'txt',
        'application/zip': 'zip'
      };
      
      const extension = mimeToExt[mimeType] || 'arquivo';
      const fileName = `documento.${extension}`;
      
      return {
        name: fileName,
        extension,
        type: this.getFileTypeFromExtension(extension),
        icon: this.getFileIcon(extension)
      };
    }
    
    // Para outros tipos baseados no messageType
    if (messageType === 'document') {
      return {
        name: 'documento.pdf',
        extension: 'pdf',
        type: 'document',
        icon: this.getFileIcon('pdf')
      };
    }
    
    // Fallback
    return {
      name: 'arquivo',
      extension: 'arquivo',
      type: 'document',
      icon: this.getFileIcon('default')
    };
  }

  static getFileTypeFromExtension(extension: string): 'document' | 'image' | 'audio' | 'video' {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const audioExts = ['mp3', 'wav', 'ogg', 'webm', 'm4a'];
    const videoExts = ['mp4', 'webm', 'avi', 'mov'];
    
    const ext = extension.toLowerCase();
    
    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    if (videoExts.includes(ext)) return 'video';
    
    return 'document';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  static estimateBase64Size(base64Content: string): string {
    // Remover data URL prefix se existir
    const base64Data = base64Content.includes(',') 
      ? base64Content.split(',')[1] 
      : base64Content;
    
    // Calcular tamanho aproximado (base64 é ~33% maior que o original)
    const approximateBytes = (base64Data.length * 3) / 4;
    return this.formatFileSize(approximateBytes);
  }
}
