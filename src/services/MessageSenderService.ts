import { supabase } from '../integrations/supabase/client';
import { ChannelApiMappingService } from './ChannelApiMappingService';
import { RawMessage } from '@/types/messageTypes';
import { AudioCompressor } from './AudioCompressor';
import { VideoCompressor } from './VideoCompressor';
import { DetailedLogger } from './DetailedLogger';
import { RetryManager } from './RetryManager';

export class MessageSenderService {
  private channelApiMappingService: ChannelApiMappingService;
  private retryCount: number = 3; // Número de tentativas para envio
  private retryDelay: number = 1000; // Delay entre tentativas em ms
  private logger: DetailedLogger;
  private retryManager: RetryManager;

  constructor() {
    this.channelApiMappingService = new ChannelApiMappingService();
    this.logger = new DetailedLogger('MessageSenderService');
    this.retryManager = new RetryManager({
      maxRetries: this.retryCount,
      baseDelay: this.retryDelay,
      maxDelay: 5000,
      backoffMultiplier: 2
    });
  }

  private getMessageTypeForMedia(mediaType: 'image' | 'audio' | 'video' | 'document'): string {
    // Alterado para retornar o mediaType diretamente, conforme possível expectativa da API Evolution
    return mediaType;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
    
    // Remove + sign if present (Evolution API doesn't accept +)
    if (cleanNumber.startsWith("+")) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // If doesn't have country code, assume Brazil (+55)
    if (!cleanNumber.startsWith("55") && cleanNumber.length === 11) {
      cleanNumber = `55${cleanNumber}`;
    }
    
    return cleanNumber;
  }

  async validateApiConfiguration(channelId: string): Promise<boolean> {
    const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
    
    if (!apiInstance) {
      console.error(`❌ [MESSAGE_SENDER] Nenhuma instância da API configurada para o canal ${channelId}`);
      return false;
    }

    // Verificar se a instância está realmente conectada
    const isConnected = await this.checkInstanceConnection(apiInstance.base_url, apiInstance.api_key, apiInstance.instance_name);
    
    if (!isConnected) {
      console.error(`❌ [MESSAGE_SENDER] Instância ${apiInstance.instance_name} não está conectada`);
      return false;
    }

    console.log(`✅ [MESSAGE_SENDER] API Evolution configurada e conectada para canal ${channelId}: ${apiInstance.instance_name}`);
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
        const errorText = await response.text();
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
        const errorText = await response.text();
        return false;
      }

      // Aguardar um tempo para a instância reiniciar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar se a reconexão foi bem-sucedida
      return await this.checkInstanceConnection(baseUrl, apiKey, instanceName);
    } catch (error) {
      return false;
    }
  }

  async sendTextMessage(channelId: string, to: string, text: string): Promise<RawMessage> {
    return await this.retryManager.executeWithRetry(async () => {
      this.logger.info(`Iniciando envio de mensagem de texto`, { channelId, to });

      // Validar configuração da API antes de enviar
      const isConfigured = await this.validateApiConfiguration(channelId);
      if (!isConfigured) {
        const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
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

      // Obter a instância da API para o canal
      const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error(`Falha ao obter instância da API para canal ${channelId}`);
      }

      // Formatar número de telefone corretamente
      const formattedNumber = this.formatPhoneNumber(to);

      // Payload correto conforme documentação da API Evolution
      const payload = {
        number: formattedNumber,
        text: text
      };

      this.logger.debug('Enviando texto para API Evolution', { 
        endpoint: `${apiInstance.base_url}/message/sendText/${apiInstance.instance_name}` 
      });

      // Enviar mensagem usando a API Evolution
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

      // Determinar o nome do remetente com base no channelId
      let senderName: string;
      if (channelId === 'yelena') {
        senderName = 'Yelena-ai';
      } else if (channelId === 'gerente externo' || channelId === 'gerente lojas') {
        senderName = 'USUARIO_INTERNO';
      } else {
        senderName = 'USUARIO_INTERNO'; // Para os demais canais
      }

      // Salvar mensagem na tabela do canal com formato correto
      const messageData: RawMessage = {
        session_id: formattedNumber,
        message: text,
        read_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        Nome_do_contato: formattedNumber, // Nome do cliente (usar número se nome não disponível)
        mensagemtype: 'conversation',
        tipo_remetente: senderName,
        id: result.id || Date.now().toString()
      };

      await this.channelApiMappingService.saveMessageToChannel(channelId, messageData);

      this.logger.info('Mensagem de texto enviada com sucesso', { messageId: result.id });
      return messageData; // Retornar a mensagem salva
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
    return await this.retryManager.executeWithRetry(async () => {
      this.logger.info(`Iniciando envio de mídia ${mediaType}`, { channelId, to, mediaType });

      // Validar configuração da API antes de enviar
      const isConfigured = await this.validateApiConfiguration(channelId);
      if (!isConfigured) {
        const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
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

      // Obter a instância da API para o canal
      const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error(`Falha ao obter instância da API para canal ${channelId}`);
      }

      // Formatar número de telefone corretamente
      const formattedNumber = this.formatPhoneNumber(to);

      // Extrair base64 puro e mimetype
      let processedMediaUrl = mediaUrl;
      let base64Content = this.extractBase64FromDataUrl(mediaUrl);
      const mimeType = this.getMimeTypeFromDataUrl(mediaUrl);
      const fileExtension = this.getFileExtensionFromMimeType(mimeType);

      // Comprimir mídia se necessário
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

      let endpoint = "";
      let payload: any = {};

      // Para todos os tipos de mídia, usar endpoint geral conforme especificação
      endpoint = `/message/sendMedia/${apiInstance.instance_name}`;
      payload = {
        number: formattedNumber,
        mediatype: this.getMessageTypeForMedia(mediaType), // Tipo de mídia
        mimetype: mimeType, // Tipo MIME
        caption: caption || "", // Legenda
        media: base64Content, // Base64 puro sem data URL
        fileName: `media_${Date.now()}.${fileExtension}` // Nome do arquivo
      };

      this.logger.debug('Enviando mídia para API Evolution', { endpoint: `${apiInstance.base_url}${endpoint}`, mediaType });

      // Enviar mensagem usando a API Evolution
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

      // Determinar o nome do remetente com base no channelId
      let senderName: string;
      if (channelId === 'yelena') {
        senderName = 'Yelena-ai';
      } else if (channelId === 'gerente externo' || channelId === 'gerente lojas') {
        senderName = 'USUARIO_INTERNO';
      } else {
        senderName = 'USUARIO_INTERNO'; // Para os demais canais
      }

      // Salvar mensagem na tabela do canal com formato correto
      const messageData: RawMessage = {
        session_id: formattedNumber,
        message: base64Content, // Salvar o base64 da mídia
        read_at: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        Nome_do_contato: formattedNumber, // Nome do cliente (usar número se nome não disponível)
        mensagemtype: `${this.getMessageTypeForMedia(mediaType)}Message`, // Adicionar "Message" ao final
        tipo_remetente: senderName, // Quem enviou a mensagem
        id: result.id || Date.now().toString()
      };

      await this.channelApiMappingService.saveMessageToChannel(channelId, messageData);

      this.logger.info('Mensagem de mídia enviada com sucesso', { messageId: result.id, mediaType });
      return messageData; // Retornar a mensagem salva
    });
  }

  // Método genérico para envio de mensagens que unifica texto e mídia
  async sendMessage(channelId: string, to: string, content: string, mediaType?: 'text' | 'image' | 'audio' | 'video' | 'document'): Promise<RawMessage> {
    if (!mediaType || mediaType === 'text') {
      return await this.sendTextMessage(channelId, to, content);
    } else {
      // Para mídia, content deve ser a URL/base64 da mídia
      return await this.sendMediaMessage(channelId, to, content, '', mediaType);
    }
  }
}


