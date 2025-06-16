export interface N8nMessageData {
  channel: string;
  instanceName: string;
  phoneNumber: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  fileData?: string; // Base64 para arquivos
  fileName?: string;
}

export class N8nMessagingService {
  private static readonly N8N_SEND_WEBHOOK = 'https://n8n.estudioonmp.com/webhook/3a0b2487-21d0-43c7-bc7f-07404879df5434232';

  /**
   * Envia uma mensagem através do webhook universal do N8N
   */
  static async sendMessage(messageData: N8nMessageData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📤 [N8N_SERVICE] Enviando mensagem:', {
        channel: messageData.channel,
        instanceName: messageData.instanceName,
        phoneNumber: messageData.phoneNumber,
        messageType: messageData.messageType
      });

      const payload = {
        channel: messageData.channel,
        instanceName: messageData.instanceName,
        phoneNumber: messageData.phoneNumber,
        content: messageData.content,
        messageType: messageData.messageType,
        fileData: messageData.fileData || null,
        fileName: messageData.fileName || null,
        timestamp: new Date().toISOString()
      };

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
   * Envia uma mensagem de mídia através do N8N
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
    return this.sendMessage({
      channel,
      instanceName,
      phoneNumber,
      content: caption,
      messageType: mediaType,
      fileData,
      fileName
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

