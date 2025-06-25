
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { N8nMessagingService, N8nMessageData } from '@/services/N8nMessagingService';

export interface EvolutionMessageData {
  channelId: string;
  phoneNumber: string;
  message: string;
  messageType?: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaBase64?: string;
  fileName?: string;
}

export const useEvolutionApiSender = () => {
  const [sending, setSending] = useState(false);

  const sendMessage = async (messageData: EvolutionMessageData): Promise<boolean> => {
    setSending(true);
    try {
      console.log('🚀 [N8N_SENDER] Enviando mensagem via N8N:', messageData);

      // Buscar mapping do canal para obter nome da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', messageData.channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [N8N_SENDER] Mapping não encontrado para canal:', messageData.channelId);
        return false;
      }

      // Preparar dados para N8N
      const n8nData: N8nMessageData = {
        channel: mapping.channel_name,
        instanceName: mapping.instance_name,
        phoneNumber: messageData.phoneNumber,
        content: messageData.message,
        messageType: messageData.messageType || 'text',
        fileData: messageData.mediaBase64,
        fileName: messageData.fileName
      };

      // Enviar via N8N
      const result = await N8nMessagingService.sendMessage(n8nData);

      if (result.success) {
        console.log('✅ [N8N_SENDER] Mensagem enviada com sucesso via N8N');
        return true;
      } else {
        console.error('❌ [N8N_SENDER] Erro ao enviar mensagem via N8N:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [N8N_SENDER] Erro:', error);
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendTextMessage = async (channelId: string, phoneNumber: string, message: string): Promise<boolean> => {
    return sendMessage({
      channelId,
      phoneNumber,
      message,
      messageType: 'text'
    });
  };

  const sendMediaMessage = async (
    channelId: string,
    phoneNumber: string,
    mediaBase64: string,
    caption: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    fileName?: string
  ): Promise<boolean> => {
    return sendMessage({
      channelId,
      phoneNumber,
      message: caption,
      messageType: mediaType,
      mediaBase64,
      fileName
    });
  };

  const generateQRCode = async (channelId: string): Promise<any> => {
    try {
      console.log('🔄 [N8N_SENDER] Gerando QR Code para canal:', channelId);

      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        throw new Error('Mapping não encontrado para o canal');
      }

      const { EvolutionApiService } = await import('@/services/EvolutionApiService');
      const service = new EvolutionApiService({
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        instanceName: mapping.instance_name
      });

      return await service.getQRCodeForInstance(mapping.instance_name);
    } catch (error) {
      console.error('❌ [N8N_SENDER] Erro ao gerar QR Code:', error);
      throw error;
    }
  };

  const checkConnectionStatus = async (channelId: string): Promise<any> => {
    try {
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        return { connected: false, error: 'Mapping não encontrado' };
      }

      const { EvolutionApiService } = await import('@/services/EvolutionApiService');
      const service = new EvolutionApiService({
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        instanceName: mapping.instance_name
      });

      const result = await service.getConnectionStatus(mapping.instance_name);
      return result;
    } catch (error) {
      console.error('❌ [N8N_SENDER] Erro ao verificar status:', error);
      return { connected: false, error: `${error}` };
    }
  };

  return {
    sendMessage,
    sendTextMessage,
    sendMediaMessage,
    generateQRCode,
    checkConnectionStatus,
    sending
  };
};
