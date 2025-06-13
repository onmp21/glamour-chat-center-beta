
import { supabase } from '../integrations/supabase/client';
import { ChannelApiMappingService } from './ChannelApiMappingService';
import { RawMessage } from '@/types/messageTypes';
import { AudioCompressor } from './AudioCompressor';
import { VideoCompressor } from './VideoCompressor';
import { DetailedLogger } from './DetailedLogger';
import { RetryManager } from './RetryManager';

export class MessageSenderService {
  private retryCount: number = 3;
  private retryDelay: number = 1000;
  private retryManager: RetryManager;
  private logger: DetailedLogger;

  constructor() {
    this.retryManager = new RetryManager({
      maxRetries: this.retryCount,
      baseDelay: this.retryDelay,
      maxDelay: 5000,
      backoffMultiplier: 2
    });
    this.logger = new DetailedLogger('MESSAGE_SENDER');
  }

  private getMessageTypeForMedia(mediaType: 'image' | 'audio' | 'video' | 'document'): string {
    return mediaType;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
    
    if (cleanNumber.startsWith("+")) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    if (!cleanNumber.startsWith("55") && cleanNumber.length === 11) {
      cleanNumber = `55${cleanNumber}`;
    }
    
    return cleanNumber;
  }

  async validateApiConfiguration(channelId: string): Promise<boolean> {
    const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
    
    if (!apiInstance) {
      this.logger.error(`Nenhuma instância da API configurada para o canal ${channelId}`);
      return false;
    }

    const isConnected = await this.checkInstanceConnection(apiInstance.base_url, apiInstance.api_key, apiInstance.instance_name);
    
    if (!isConnected) {
      this.logger.error(`Instância ${apiInstance.instance_name} não está conectada`);
      return false;
    }

    this.logger.info(`API Evolution configurada e conectada para canal ${channelId}: ${apiInstance.instance_name}`);
    return true;
  }

  private async checkInstanceConnection(baseUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const isConnected = data.instance?.state === 'open';
      
      return isConnected;
    } catch (error) {
      return false;
    }
  }

  private async reconnectInstance(baseUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return await this.checkInstanceConnection(baseUrl, apiKey, instanceName);
    } catch (error) {
      return false;
    }
  }

  async sendTextMessage(channelId: string, to: string, text: string): Promise<RawMessage> {
    return await RetryManager.executeWithRetry(async () => {
      this.logger.info(`Iniciando envio de mensagem de texto`, { channelId, to });

      const isConfigured = await this.validateApiConfiguration(channelId);
      if (!isConfigured) {
        const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
        if (apiInstance) {
          const reconnected = await this.reconnectInstance(
            apiInstance.base_url, 
            apiInstance.api_key, 
            apiInstance.instance_name
          );
          
          if (!reconnected) {
            throw new Error(`API Evolution não configurada ou não conectada para o canal ${channelId}`);
          }
        } else {
          throw new Error(`API Evolution não configurada ou não conectada para o canal ${channelId}`);
        }
      }

      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error(`Falha ao obter instância da API para canal ${channelId}`);
      }

      const formattedNumber = this.formatPhoneNumber(to);

      const payload = {
        number: formattedNumber,
        text: text
      };

      this.logger.debug('Enviando texto para API Evolution', { 
        endpoint: `${apiInstance.base_url}/message/sendText/${apiInstance.instance_name}` 
      });

      const response = await fetch(`${apiInstance.base_url}/message/sendText/${apiInstance.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiInstance.api_key
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Erro na resposta da API Evolution', { 
          status: response.status, 
          statusText: response.statusText, 
          body: errorText 
        });
        throw new Error(`Falha ao enviar mensagem: ${response.statusText}`);
      }

      const result = await response.json();

      let senderName: string;
      if (channelId === 'yelena') {
        senderName = 'Yelena-ai';
      } else if (channelId === 'gerente externo' || channelId === 'gerente lojas') {
        senderName = 'USUARIO_INTERNO';
      } else {
        senderName = 'USUARIO_INTERNO';
      }

      const messageData: RawMessage = {
        session_id: formattedNumber,
        message: text,
        read_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        Nome_do_contato: formattedNumber,
        mensagemtype: 'conversation',
        tipo_remetente: senderName,
        id: result.id || Date.now().toString(),
        sender: 'agent',
        timestamp: new Date().toISOString(),
        content: text
      };

      await ChannelApiMappingService.saveMessageToChannel(channelId, messageData);

      this.logger.info('Mensagem de texto enviada com sucesso', { messageId: result.id });
      return messageData;
    }, {
      maxRetries: this.retryCount,
      baseDelay: this.retryDelay,
      maxDelay: 5000,
      backoffMultiplier: 2
    });
  }

  private extractBase64FromDataUrl(dataUrl: string): string {
    if (dataUrl.includes('base64,')) {
      return dataUrl.split('base64,')[1];
    }
    return dataUrl;
  }

  private getMimeTypeFromDataUrl(dataUrl: string): string {
    const mimeMatch = dataUrl.match(/data:([^;]+)/);
    return mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  }

  private getFileExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf'
    };
    return mimeToExt[mimeType] || 'bin';
  }

  async sendMediaMessage(channelId: string, to: string, mediaUrl: string, caption: string, mediaType: 'image' | 'audio' | 'video' | 'document'): Promise<RawMessage> {
    return await RetryManager.executeWithRetry(async () => {
      this.logger.info(`Iniciando envio de mídia ${mediaType}`, { channelId, to, mediaType });

      const isConfigured = await this.validateApiConfiguration(channelId);
      if (!isConfigured) {
        const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
        if (apiInstance) {
          const reconnected = await this.reconnectInstance(
            apiInstance.base_url, 
            apiInstance.api_key, 
            apiInstance.instance_name
          );
          
          if (!reconnected) {
            throw new Error(`API Evolution não configurada ou não conectada para o canal ${channelId}`);
          }
        } else {
          throw new Error(`API Evolution não configurada ou não conectada para o canal ${channelId}`);
        }
      }

      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error(`Falha ao obter instância da API para canal ${channelId}`);
      }

      const formattedNumber = this.formatPhoneNumber(to);

      let base64Content = this.extractBase64FromDataUrl(mediaUrl);
      const mimeType = this.getMimeTypeFromDataUrl(mediaUrl);
      const fileExtension = this.getFileExtensionFromMimeType(mimeType);

      if (mediaType === 'audio') {
        this.logger.info('Comprimindo áudio antes do envio');
        const compressionResult = await AudioCompressor.compressAudio(base64Content, {
          quality: 0.7,
          maxSizeKB: 500,
          format: 'ogg'
        });

        if (compressionResult.success && compressionResult.compressedData) {
          base64Content = this.extractBase64FromDataUrl(compressionResult.compressedData);
          this.logger.info('Áudio comprimido com sucesso', {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio
          });
        } else {
          this.logger.warn('Falha na compressão de áudio, usando original', { error: compressionResult.error });
        }
      } else if (mediaType === 'video') {
        this.logger.info('Comprimindo vídeo antes do envio');
        const compressionResult = await VideoCompressor.compressVideo(base64Content, {
          quality: 0.7,
          maxSizeKB: 2000,
          format: 'mp4'
        });

        if (compressionResult.success && compressionResult.compressedData) {
          base64Content = this.extractBase64FromDataUrl(compressionResult.compressedData);
          this.logger.info('Vídeo comprimido com sucesso', {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio
          });
        } else {
          this.logger.warn('Falha na compressão de vídeo, usando original', { error: compressionResult.error });
        }
      }

      const endpoint = `/message/sendMedia/${apiInstance.instance_name}`;
      const payload = {
        number: formattedNumber,
        mediatype: this.getMessageTypeForMedia(mediaType),
        mimetype: mimeType,
        caption: caption || "",
        media: base64Content,
        fileName: `media_${Date.now()}.${fileExtension}`
      };

      this.logger.debug('Enviando mídia para API Evolution', { endpoint: `${apiInstance.base_url}${endpoint}`, mediaType });

      const response = await fetch(`${apiInstance.base_url}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiInstance.api_key
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Erro na resposta da API Evolution', { 
          status: response.status, 
          statusText: response.statusText, 
          body: errorText 
        });
        throw new Error(`Falha ao enviar mensagem de mídia: ${response.statusText}`);
      }

      const result = await response.json();

      let senderName: string;
      if (channelId === 'yelena') {
        senderName = 'Yelena-ai';
      } else if (channelId === 'gerente externo' || channelId === 'gerente lojas') {
        senderName = 'USUARIO_INTERNO';
      } else {
        senderName = 'USUARIO_INTERNO';
      }

      const messageData: RawMessage = {
        session_id: formattedNumber,
        message: base64Content,
        read_at: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        Nome_do_contato: formattedNumber,
        mensagemtype: `${this.getMessageTypeForMedia(mediaType)}Message`,
        tipo_remetente: senderName,
        id: result.id || Date.now().toString(),
        sender: 'agent',
        timestamp: new Date().toISOString(),
        content: base64Content
      };

      await ChannelApiMappingService.saveMessageToChannel(channelId, messageData);

      this.logger.info('Mensagem de mídia enviada com sucesso', { messageId: result.id, mediaType });
      return messageData;
    }, {
      maxRetries: this.retryCount,
      baseDelay: this.retryDelay,
      maxDelay: 5000,
      backoffMultiplier: 2
    });
  }

  async sendMessage(channelId: string, to: string, content: string, mediaType?: 'text' | 'image' | 'audio' | 'video' | 'document'): Promise<RawMessage> {
    if (!mediaType || mediaType === 'text') {
      return await this.sendTextMessage(channelId, to, content);
    } else {
      return await this.sendMediaMessage(channelId, to, content, '', mediaType);
    }
  }
}
