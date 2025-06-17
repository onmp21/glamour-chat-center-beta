export interface N8nMessageData {
  channel: string;
  instanceName: string;
  phoneNumber: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  fileData?: string; // Base64 puro para arquivos
  fileName?: string;
  fileFormat?: string; // Formato separado (mp3, jpg, pdf, etc.)
}

export class N8nMessagingService {
  private static readonly N8N_SEND_WEBHOOK = 'https://n8n.estudioonmp.com/webhook/3a0b2487-21d0-43c7-bc7f-07404879df5434232';

  /**
   * Extrai base64 puro (sem prefixo data:)
   */
  private static extractPureBase64(dataUrl: string): string {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      return parts.length > 1 ? parts[1] : dataUrl;
    }
    return dataUrl;
  }

  /**
   * Extrai formato do arquivo do MIME type ou extensão
   */
  private static extractFileFormat(mimeType: string, fileName?: string): string {
    // Primeiro tentar pelo fileName
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension) return extension;
    }

    // Fallback para MIME type
    const mimeToFormat: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };

    return mimeToFormat[mimeType] || 'bin';
  }

  /**
   * Detecta MIME type de base64
   */
  private static detectMimeType(base64Data: string): string {
    const pureBase64 = this.extractPureBase64(base64Data);
    
    if (pureBase64.startsWith('/9j/')) return 'image/jpeg';
    if (pureBase64.startsWith('iVBORw')) return 'image/png';
    if (pureBase64.startsWith('R0lGO')) return 'image/gif';
    if (pureBase64.startsWith('UklGR')) return 'image/webp';
    if (pureBase64.startsWith('JVBERi')) return 'application/pdf';
    if (pureBase64.startsWith('SUQz') || pureBase64.startsWith('//uQ')) return 'audio/mpeg';
    if (pureBase64.startsWith('T2dn')) return 'audio/ogg';
    if (pureBase64.startsWith('AAAAGG') || pureBase64.startsWith('AAAAFG')) return 'video/mp4';
    
    return 'application/octet-stream';
  }

  /**
   * Envia uma mensagem através do webhook universal do N8N
   */
  static async sendMessage(messageData: N8nMessageData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📤 [N8N_SERVICE] Enviando mensagem:', {
        channel: messageData.channel,
        instanceName: messageData.instanceName,
        phoneNumber: messageData.phoneNumber,
        messageType: messageData.messageType,
        hasFileData: !!messageData.fileData,
        fileFormat: messageData.fileFormat
      });

      const payload = {
        channel: messageData.channel,
        instanceName: messageData.instanceName,
        phoneNumber: messageData.phoneNumber,
        content: messageData.content,
        messageType: messageData.messageType,
        fileData: messageData.fileData || null,
        fileName: messageData.fileName || null,
        fileFormat: messageData.fileFormat || null,
        timestamp: new Date().toISOString()
      };

      console.log('📤 [N8N_SERVICE] Payload preparado:', {
        ...payload,
        fileData: payload.fileData ? `${payload.fileData.substring(0, 50)}...` : null
      });

      const response = await fetch(this.N8N_SEND_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [N8N_SERVICE] Erro na resposta:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('✅ [N8N_SERVICE] Mensagem enviada com sucesso:', result);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [N8N_SERVICE] Erro ao enviar mensagem:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Envia uma mensagem de texto através do N8N
   */
  static async sendTextMessage(
    channel: string,
    instanceName: string,
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage({
      channel,
      instanceName,
      phoneNumber,
      content: message,
      messageType: 'text'
    });
  }

  /**
   * Envia uma mensagem de mídia através do N8N (com base64 puro)
   */
  static async sendMediaMessage(
    channel: string,
    instanceName: string,
    phoneNumber: string,
    fileData: string,
    caption: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    fileName?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Extrair base64 puro (sem prefixo data:)
    const pureBase64 = this.extractPureBase64(fileData);
    
    // Detectar MIME type se não temos fileName
    let mimeType = 'application/octet-stream';
    if (fileData.startsWith('data:')) {
      const mimeMatch = fileData.match(/data:([^;]+)/);
      mimeType = mimeMatch ? mimeMatch[1] : this.detectMimeType(fileData);
    } else {
      mimeType = this.detectMimeType(fileData);
    }

    // Extrair formato do arquivo
    const fileFormat = this.extractFileFormat(mimeType, fileName);

    console.log('🎥 [N8N_SERVICE] Preparando mídia:', {
      mediaType,
      mimeType,
      fileFormat,
      fileName,
      base64Length: pureBase64.length,
      isPureBase64: !pureBase64.includes('data:')
    });

    return this.sendMessage({
      channel,
      instanceName,
      phoneNumber,
      content: caption,
      messageType: mediaType,
      fileData: pureBase64, // Base64 puro sem prefixo
      fileName,
      fileFormat // Formato separado
    });
  }

  /**
   * Valida se o webhook N8N está acessível
   */
  static async validateWebhook(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 [N8N_SERVICE] Validando webhook N8N...');

      const testPayload = {
        test: true,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.N8N_SEND_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [N8N_SERVICE] Webhook não acessível:', response.status, errorText);
        return { success: false, error: `Webhook não acessível: HTTP ${response.status}` };
      }

      console.log('✅ [N8N_SERVICE] Webhook N8N validado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [N8N_SERVICE] Erro ao validar webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}
