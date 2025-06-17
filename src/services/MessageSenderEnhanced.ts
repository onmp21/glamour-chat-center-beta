import { supabase } from '@/integrations/supabase/client';
import { N8nMessagingService } from './N8nMessagingService';
import { DatabaseHelpers } from './DatabaseHelpers';

export class MessageSenderEnhanced {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async sendTextMessage(instanceName: string, phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log('📱 [MESSAGE_SENDER] Enviando texto via N8N:', {
        instanceName,
        phoneNumber,
        messageLength: message.length
      });

      // Buscar mapping para obter nome do canal
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('instance_name', instanceName)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [MESSAGE_SENDER] Mapping não encontrado para instância:', instanceName);
        return false;
      }

      // Enviar via N8N
      const result = await N8nMessagingService.sendTextMessage(
        mapping.channel_name,
        instanceName,
        phoneNumber,
        message
      );

      console.log('📱 [MESSAGE_SENDER] Resposta do N8N:', result);
      return result.success;
    } catch (error) {
      console.error('❌ [MESSAGE_SENDER] Erro ao enviar texto:', error);
      return false;
    }
  }

  async sendMediaMessage(
    instanceName: string, 
    phoneNumber: string, 
    mediaUrl: string, 
    caption: string, 
    mediaType: 'image' | 'audio' | 'video' | 'document'
  ): Promise<boolean> {
    try {
      console.log('🎥 [MESSAGE_SENDER] Enviando mídia via N8N:', {
        instanceName,
        phoneNumber,
        mediaType,
        captionLength: caption.length,
        hasMediaUrl: mediaUrl.length > 0
      });

      // Buscar mapping para obter nome do canal
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('instance_name', instanceName)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [MESSAGE_SENDER] Mapping não encontrado para instância:', instanceName);
        return false;
      }

      // Enviar via N8N
      const result = await N8nMessagingService.sendMediaMessage(
        mapping.channel_name,
        instanceName,
        phoneNumber,
        mediaUrl,
        caption || '',
        mediaType
      );

      console.log('🎥 [MESSAGE_SENDER] Resposta do N8N:', result);
      return result.success;
    } catch (error) {
      console.error('❌ [MESSAGE_SENDER] Erro ao enviar mídia:', error);
      return false;
    }
  }

  async generateQRCode(instanceName: string): Promise<{ qrCode?: string; pairingCode?: string; error?: string }> {
    try {
      console.log('🔲 [QR_CODE] Gerando QR Code para:', instanceName);
      console.log('🔲 [QR_CODE] URL:', `${this.baseUrl}/instance/connect/${instanceName}`);

      const response = await fetch(`${this.baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey
        }
      });

      console.log('🔲 [QR_CODE] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [QR_CODE] Resposta de erro:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('🔲 [QR_CODE] Resultado:', result);

      if (result.base64) {
        return { 
          qrCode: result.base64,
          pairingCode: result.pairingCode 
        };
      } else if (result.code) {
        return { 
          qrCode: result.code,
          pairingCode: result.pairingCode 
        };
      } else if (result.qrcode) {
        return { 
          qrCode: result.qrcode,
          pairingCode: result.pairingCode 
        };
      } else {
        console.error('❌ [QR_CODE] Formato de resposta inesperado:', result);
        return { error: 'QR Code não encontrado na resposta da API' };
      }
    } catch (error) {
      console.error('❌ [QR_CODE] Erro:', error);
      return { 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar QR Code' 
      };
    }
  }

  async checkInstanceConnection(instanceName: string): Promise<boolean> {
    try {
      console.log('🔍 [INSTANCE_CHECK] Verificando conexão para:', instanceName);

      const response = await fetch(`${this.baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ [INSTANCE_CHECK] Erro na resposta:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('🔍 [INSTANCE_CHECK] Estado da conexão:', result);

      return result.state === 'open' || result.instance?.state === 'open';
    } catch (error) {
      console.error('❌ [INSTANCE_CHECK] Erro ao verificar conexão:', error);
      return false;
    }
  }

  async restartInstance(instanceName: string): Promise<boolean> {
    try {
      console.log('🔄 [INSTANCE_RESTART] Reiniciando instância:', instanceName);

      const response = await fetch(`${this.baseUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: {
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ [INSTANCE_RESTART] Erro na resposta:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('🔄 [INSTANCE_RESTART] Resultado:', result);

      return result.status !== 'error';
    } catch (error) {
      console.error('❌ [INSTANCE_RESTART] Erro ao reiniciar instância:', error);
      return false;
    }
  }

  async logoutInstance(instanceName: string): Promise<boolean> {
    try {
      console.log('🚪 [INSTANCE_LOGOUT] Fazendo logout da instância:', instanceName);

      const response = await fetch(`${this.baseUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ [INSTANCE_LOGOUT] Erro na resposta:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('🚪 [INSTANCE_LOGOUT] Resultado:', result);

      return result.status !== 'error';
    } catch (error) {
      console.error('❌ [INSTANCE_LOGOUT] Erro ao fazer logout da instância:', error);
      return false;
    }
  }

  async saveMessageToDatabase(
    tableName: string,
    sessionId: string,
    message: string,
    messageType: string = 'text',
    agentName: string = 'Atendente'
  ): Promise<void> {
    try {
      console.log('💾 [DATABASE] Salvando mensagem:', {
        tableName,
        sessionId,
        messageType,
        agentName
      });

      await DatabaseHelpers.insertMessageDynamic(
        tableName,
        sessionId,
        message,
        messageType,
        'USUARIO_INTERNO'
      );

      console.log('✅ [DATABASE] Mensagem salva com sucesso');
    } catch (error) {
      console.error('❌ [DATABASE] Erro:', error);
      throw error;
    }
  }
}

