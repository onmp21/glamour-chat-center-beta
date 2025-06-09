
export class MessageTypeMapper {
  private static readonly TYPE_MAP: Record<string, string> = {
    'text': 'text',
    'image': 'image',
    'audio': 'audio',
    'video': 'video',
    'document': 'document',
    'human': 'human',
    'ai': 'ai'
  };

  static mapMessageType(mensagemtype?: string): 'text' | 'image' | 'audio' | 'video' | 'document' | 'human' | 'ai' {
    if (!mensagemtype) return 'text';
    return (this.TYPE_MAP[mensagemtype] as any) || 'text';
  }

  static isMediaType(messageType: string): boolean {
    return ['image', 'audio', 'video', 'document'].includes(messageType);
  }

  static getMimeTypeFromMessageType(messageType: string): string {
    const mimeMap: Record<string, string> = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'document': 'application/octet-stream'
    };
    
    return mimeMap[messageType] || 'application/octet-stream';
  }
}
