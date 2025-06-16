
import { supabase } from '../integrations/supabase/client';
import { ChannelApiMappingService } from './ChannelApiMappingServiceRefactored';
import { RawMessage } from '@/types/messageTypes';
import { AudioCompressor } from './AudioCompressor';
import { VideoCompressor } from './VideoCompressor';
import { DetailedLogger } from './DetailedLogger';
import { RetryManager } from './RetryManager';
import { getContactDisplayName } from "@/utils/getContactDisplayName";

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
    // Retorna apenas o tipo simples conforme documentação Evolution API v2
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
        method: 'PUT', // Corrigido para PUT conforme documentação
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

  async sendTextMessage(channelId: string, to: string, text: string, senderType: "customer" | "agent" = "agent", contactName?: string | null): Promise<RawMessage> {
    const realChannelId = await ChannelApiMappingService.getChannelUuid(channelId) || channelId;
    return await RetryManager.executeWithRetry(async () => {
      this.logger.info(`Iniciando envio de mensagem de texto`, { channelId, to });
      const isConfigured = await this.validateApiConfiguration(realChannelId);
      if (!isConfigured) {
        const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(realChannelId);
        if (apiInstance) {
          const reconnected = await this.reconnectInstance(
            apiInstance.base_url, 
            apiInstance.api_key, 
            apiInstance.instance_name
          );
          if (!reconnected) {
            throw new Error(`API Evolution não configurada ou não conectada para o canal ${realChannelId}`);
          }
        } else {
          throw new Error(`API Evolution não configurada ou não conectada para o canal ${realChannelId}`);
        }
      }
      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(realChannelId);
      if (!apiInstance) {
        throw new Error(`Falha ao obter instância da API para canal ${realChannelId}`);
      }
      const formattedNumber = this.formatPhoneNumber(to);

      let nomeDoContato: string | null = getContactDisplayName({
        sender: senderType,
        contactName: contactName,
      });

      const payload = {
        number: formattedNumber,
        text: text
      };

      this.logger.debug('Enviando texto para API Evolution', { 
        endpoint: `${apiInstance.base_url}/message/sendText/${apiInstance.instance_name}`,
        payload 
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
        throw new Error(`Falha ao enviar mensagem: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.debug('Resposta da API Evolution', { result });

      // Sempre usar valores válidos para data e nome_do_contato (NUNCA NÚMERO)
      const nowIso = new Date().toISOString();
      // Usar null para nome_do_contato fora de mensagens do cliente!
      const messageData: RawMessage = {
        session_id: formattedNumber,
        message: text,
        read_at: nowIso,
        nome_do_contato: nomeDoContato,
        mensagemtype: 'conversation',
        tipo_remetente: senderType === "agent" ? 'USUARIO_INTERNO' : 'CLIENTE',
        id: result.key?.id || result.messageId || Date.now().toString(),
        sender: senderType,
        timestamp: nowIso,
        content: text,
        media_base64: null
      };

      // Log de validação
      this.logger.debug('Salvando mensagem no canal', {
        realChannelId, table: '...', messageData
      });

      // Tenta salvar a mensagem e lança erro se falhar
      await ChannelApiMappingService.saveMessageToChannel(realChannelId, messageData);

      this.logger.info('Mensagem de texto enviada com sucesso', { messageId: result.key?.id });
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

  async sendMediaMessage(
    channelId: string,
    to: string,
    mediaUrl: string,
    caption: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    senderType: "customer" | "agent" = "agent",
    contactName?: string | null
  ): Promise<RawMessage> {
    const realChannelId = await ChannelApiMappingService.getChannelUuid(channelId) || channelId;
    return await RetryManager.executeWithRetry(async () => {
      this.logger.info(`Iniciando envio de mídia ${mediaType}`, { channelId, to, mediaType });

      const isConfigured = await this.validateApiConfiguration(realChannelId);
      if (!isConfigured) {
        const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(realChannelId);
        if (apiInstance) {
          const reconnected = await this.reconnectInstance(
            apiInstance.base_url, 
            apiInstance.api_key, 
            apiInstance.instance_name
          );
          if (!reconnected) {
            throw new Error(`API Evolution não configurada ou não conectada para o canal ${realChannelId}`);
          }
        } else {
          throw new Error(`API Evolution não configurada ou não conectada para o canal ${realChannelId}`);
        }
      }

      const apiInstance = await ChannelApiMappingService.getApiInstanceForChannel(realChannelId);
      if (!apiInstance) {
        throw new Error(`Falha ao obter instância da API para canal ${realChannelId}`);
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
        mediatype: mediaType,
        mimetype: mimeType,
        caption: caption || "",
        media: `data:${mimeType};base64,${base64Content}`,
        fileName: `media_${Date.now()}.${fileExtension}`
      };

      this.logger.debug('Enviando mídia para API Evolution', { 
        endpoint: `${apiInstance.base_url}${endpoint}`, 
        mediaType,
        payload: { ...payload, media: '[BASE64_DATA]' }
      });

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
        throw new Error(`Falha ao enviar mensagem de mídia: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.debug('Resposta da API Evolution para mídia', { result });

      // Data padrão
      const nowIso = new Date().toISOString();

      let nomeDoContato: string | null = getContactDisplayName({
        sender: senderType,
        contactName: contactName,
      });

      const messageData: RawMessage = {
        session_id: formattedNumber,
        message: `data:${mimeType};base64,${base64Content}`,
        read_at: nowIso,
        nome_do_contato: nomeDoContato,
        mensagemtype: mediaType,
        tipo_remetente: senderType === "agent" ? 'USUARIO_INTERNO' : 'CLIENTE',
        id: result.key?.id || result.messageId || Date.now().toString(),
        sender: senderType,
        timestamp: nowIso,
        content: `data:${mimeType};base64,${base64Content}`,
        media_base64: `data:${mimeType};base64,${base64Content}`,
      };

      // Log de validação
      this.logger.debug('Salvando mensagem de mídia no canal', {
        realChannelId, table: '...', messageData
      });

      await ChannelApiMappingService.saveMessageToChannel(realChannelId, messageData);

      this.logger.info('Mensagem de mídia enviada com sucesso', { messageId: result.key?.id, mediaType });
      return messageData;
    }, {
      maxRetries: this.retryCount,
      baseDelay: this.retryDelay,
      maxDelay: 5000,
      backoffMultiplier: 2
    });
  }

  async sendMessage(
    channelId: string,
    to: string,
    content: string,
    mediaType?: 'text' | 'image' | 'audio' | 'video' | 'document',
    senderType: "customer" | "agent" = "agent",
    contactName?: string | null
  ): Promise<RawMessage> {
    if (!mediaType || mediaType === 'text') {
      return await this.sendTextMessage(channelId, to, content, senderType, contactName);
    } else {
      return await this.sendMediaMessage(channelId, to, content, '', mediaType, senderType, contactName);
    }
  }
}
