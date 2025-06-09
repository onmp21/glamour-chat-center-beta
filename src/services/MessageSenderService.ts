import { supabase } from '../integrations/supabase/client';
import { ChannelApiMappingService } from './ChannelApiMappingService';
import { RawMessage } from '@/types/messageTypes';

export class MessageSenderService {
  private channelApiMappingService: ChannelApiMappingService;
  private retryCount: number = 3; // Número de tentativas para envio
  private retryDelay: number = 1000; // Delay entre tentativas em ms

  constructor() {
    this.channelApiMappingService = new ChannelApiMappingService();
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove + sign if present (Evolution API doesn't accept +)
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // If doesn't have country code, assume Brazil (+55)
    if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
      cleanNumber = `55${cleanNumber}`;
    }
    
    console.log(`📞 [MESSAGE_SENDER] Número formatado: ${phoneNumber} -> ${cleanNumber}`);
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
      console.log(`🔍 [MESSAGE_SENDER] Verificando conexão da instância ${instanceName} em ${baseUrl}`);
      
      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [MESSAGE_SENDER] Erro ao verificar status da conexão: ${response.status} - ${errorText}`);
        return false;
      }

      const data = await response.json();
      const isConnected = data.instance?.state === 'open';
      
      console.log(`🔍 [MESSAGE_SENDER] Status da instância ${instanceName}: ${data.instance?.state}`);
      return isConnected;
    } catch (error) {
      console.error('❌ [MESSAGE_SENDER] Erro ao verificar conexão da instância:', error);
      return false;
    }
  }

  // Método para tentar reconectar a instância
  private async reconnectInstance(baseUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    try {
      console.log(`🔄 [MESSAGE_SENDER] Tentando reconectar instância ${instanceName}`);
      
      const response = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [MESSAGE_SENDER] Erro ao reconectar instância: ${response.status} - ${errorText}`);
        return false;
      }

      // Aguardar um tempo para a instância reiniciar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar se a reconexão foi bem-sucedida
      return await this.checkInstanceConnection(baseUrl, apiKey, instanceName);
    } catch (error) {
      console.error('❌ [MESSAGE_SENDER] Erro ao reconectar instância:', error);
      return false;
    }
  }

  async sendTextMessage(channelId: string, to: string, text: string): Promise<RawMessage> {
    let attempts = 0;
    
    while (attempts < this.retryCount) {
      try {
        attempts++;
        console.log(`📤 [MESSAGE_SENDER] Enviando mensagem de texto para ${to} no canal ${channelId} (tentativa ${attempts}/${this.retryCount})`);

        // Validar configuração da API antes de enviar
        const isConfigured = await this.validateApiConfiguration(channelId);
        if (!isConfigured) {
          // Tentar reconectar a instância antes de falhar
          const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
          if (apiInstance && attempts === 1) {
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
          console.error(`❌ [MESSAGE_SENDER] Falha ao obter instância da API para canal ${channelId}`);
          throw new Error(`Falha ao obter instância da API para canal ${channelId}`);
        }

        // Formatar número de telefone corretamente
        const formattedNumber = this.formatPhoneNumber(to);

        console.log(`🔄 [MESSAGE_SENDER] Enviando via API Evolution: ${apiInstance.base_url}/message/sendText/${apiInstance.instance_name}`);

        // Payload correto conforme documentação da API Evolution
        const payload = {
          number: formattedNumber,
          text: text,
          delay: 1200
        };

        console.log(`📋 [MESSAGE_SENDER] Payload sendo enviado:`, payload);

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
          console.error(`❌ [MESSAGE_SENDER] Falha ao enviar mensagem: ${response.status} - ${errorText}`);
          
          // Se não for a última tentativa, tentar novamente
          if (attempts < this.retryCount) {
            console.log(`🔄 [MESSAGE_SENDER] Tentando novamente em ${this.retryDelay/1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            continue;
          }
          
          throw new Error(`Falha ao enviar mensagem: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ [MESSAGE_SENDER] Mensagem enviada com sucesso via API Evolution:`, result);

        // Salvar mensagem na tabela do canal
        const messageData: RawMessage = {
          session_id: `${formattedNumber}_${Date.now()}`,
          message: text,
          tipo_remetente: 'agent',
          nome_do_contato: formattedNumber,
          mensagemtype: 'text',
          read_at: new Date().toISOString(),
          id: result.id || Date.now().toString() // Usar ID da API se disponível, senão gerar um
        };

        await this.channelApiMappingService.saveMessageToChannel(channelId, messageData);

        console.log(`💾 [MESSAGE_SENDER] Mensagem salva no banco para canal ${channelId}`);
        return messageData; // Retornar a mensagem salva
      } catch (error) {
        console.error(`❌ [MESSAGE_SENDER] Erro ao enviar mensagem de texto (tentativa ${attempts}/${this.retryCount}):`, error);
        
        // Se não for a última tentativa, tentar novamente
        if (attempts < this.retryCount) {
          console.log(`🔄 [MESSAGE_SENDER] Tentando novamente em ${this.retryDelay/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw error;
        }
      }
    }
    
    // Este ponto só é alcançado se todas as tentativas falharem
    throw new Error(`Falha ao enviar mensagem após ${this.retryCount} tentativas`);
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
    let attempts = 0;
    
    while (attempts < this.retryCount) {
      try {
        attempts++;
        console.log(`📤 [MESSAGE_SENDER] Enviando mensagem de mídia (${mediaType}) para ${to} no canal ${channelId} (tentativa ${attempts}/${this.retryCount})`);

        // Validar configuração da API antes de enviar
        const isConfigured = await this.validateApiConfiguration(channelId);
        if (!isConfigured) {
          // Tentar reconectar a instância antes de falhar
          const apiInstance = await this.channelApiMappingService.getApiInstanceForChannel(channelId);
          if (apiInstance && attempts === 1) {
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
          console.error(`❌ [MESSAGE_SENDER] Falha ao obter instância da API para canal ${channelId}`);
          throw new Error(`Falha ao obter instância da API para canal ${channelId}`);
        }

        // Formatar número de telefone corretamente
        const formattedNumber = this.formatPhoneNumber(to);

        // Extrair base64 puro e mimetype
        const base64Content = this.extractBase64FromDataUrl(mediaUrl);
        const mimeType = this.getMimeTypeFromDataUrl(mediaUrl);
        const fileExtension = this.getFileExtensionFromMimeType(mimeType);

        let endpoint = '';
        let payload: any = {};

        if (mediaType === 'audio') {
          // Para áudios, usar endpoint específico conforme documentação
          endpoint = `/message/sendWhatsAppAudio/${apiInstance.instance_name}`;
          payload = {
            number: formattedNumber,
            audio: base64Content,
            delay: 1200
          };
        } else {
          // Para outros tipos de mídia, usar endpoint geral
          endpoint = `/message/sendMedia/${apiInstance.instance_name}`;
          payload = {
            number: formattedNumber,
            mediatype: mediaType,
            mimetype: mimeType,
            caption: caption || '',
            media: base64Content,
            fileName: `file.${fileExtension}`,
            delay: 1200
          };
        }

        console.log(`🔄 [MESSAGE_SENDER] Enviando ${mediaType} via API Evolution: ${apiInstance.base_url}${endpoint}`);
        console.log(`📋 [MESSAGE_SENDER] Payload sendo enviado:`, {
          ...payload,
          [mediaType === 'audio' ? 'audio' : 'media']: `[BASE64_DATA_${Math.round(base64Content.length/1024)}KB]`
        });

        // Enviar mensagem usando a API Evolution
        const response = await fetch(`${apiInstance.base_url}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiInstance.api_key
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [MESSAGE_SENDER] Falha ao enviar mensagem de mídia: ${response.status} - ${errorText}`);
          
          // Se não for a última tentativa, tentar novamente
          if (attempts < this.retryCount) {
            console.log(`🔄 [MESSAGE_SENDER] Tentando novamente em ${this.retryDelay/1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            continue;
          }
          
          throw new Error(`Falha ao enviar mensagem de mídia: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ [MESSAGE_SENDER] Mensagem de ${mediaType} enviada com sucesso via API Evolution:`, result);

        // Salvar mensagem na tabela do canal
        const messageData: RawMessage = {
          session_id: `${formattedNumber}_${Date.now()}`,
          message: caption || `Arquivo ${mediaType} enviado`,
          tipo_remetente: 'agent',
          nome_do_contato: formattedNumber,
          mensagemtype: mediaType,
          read_at: new Date().toISOString(),
          id: result.id || Date.now().toString() // Usar ID da API se disponível, senão gerar um
        };

        await this.channelApiMappingService.saveMessageToChannel(channelId, messageData);

        console.log(`💾 [MESSAGE_SENDER] Mensagem de ${mediaType} salva no banco para canal ${channelId}`);
        return messageData; // Retornar a mensagem salva
      } catch (error) {
        console.error(`❌ [MESSAGE_SENDER] Erro ao enviar mensagem de ${mediaType} (tentativa ${attempts}/${this.retryCount}):`, error);
        
        // Se não for a última tentativa, tentar novamente
        if (attempts < this.retryCount) {
          console.log(`🔄 [MESSAGE_SENDER] Tentando novamente em ${this.retryDelay/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw error;
        }
      }
    }
    
    // Este ponto só é alcançado se todas as tentativas falharem
    throw new Error(`Falha ao enviar mensagem de mídia após ${this.retryCount} tentativas`);
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
