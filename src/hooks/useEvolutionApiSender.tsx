import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EvolutionApiService } from '@/services/EvolutionApiService';

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
      console.log('🚀 [EVOLUTION_API_SENDER] Enviando mensagem:', messageData);

      // Use correct table and property
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', messageData.channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [EVOLUTION_API_SENDER] Mapping não encontrado para canal:', messageData.channelId);
        return false;
      }

      // Fetch instance fields directly; mapping row contains them per migration
      const apiInstance = {
        base_url: mapping.base_url,
        api_key: mapping.api_key,
        instance_name: mapping.instance_name,
      };
      if (!apiInstance.base_url || !apiInstance.api_key || !apiInstance.instance_name) {
        console.error('❌ [EVOLUTION_API_SENDER] Instância da API incompleta');
        return false;
      }

      // Create Evolution API service
      const service = new EvolutionApiService({
        baseUrl: apiInstance.base_url,
        apiKey: apiInstance.api_key,
        instanceName: apiInstance.instance_name
      });

      // Send message using sendTextMessage method with correct parameters
      const result = await service.sendTextMessage(messageData.phoneNumber, messageData.message);

      if (result.success) {
        console.log('✅ [EVOLUTION_API_SENDER] Mensagem enviada com sucesso');
        return true;
      } else {
        console.error('❌ [EVOLUTION_API_SENDER] Erro ao enviar mensagem:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SENDER] Erro:', error);
      return false;
    } finally {
      setSending(false);
    }
  };

  const generateQRCode = async (channelId: string): Promise<any> => {
    try {
      console.log('🔄 [EVOLUTION_API_SENDER] Gerando QR Code para canal:', channelId);

      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        throw new Error('Mapping não encontrado para o canal');
      }

      const apiInstance = {
        base_url: mapping.base_url,
        api_key: mapping.api_key,
        instance_name: mapping.instance_name,
      };
      if (!apiInstance.base_url || !apiInstance.api_key || !apiInstance.instance_name) {
        throw new Error('Instância da API incompleta');
      }

      const service = new EvolutionApiService({
        baseUrl: apiInstance.base_url,
        apiKey: apiInstance.api_key,
        instanceName: apiInstance.instance_name
      });

      return await service.getQRCodeForInstance(apiInstance.instance_name);
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SENDER] Erro ao gerar QR Code:', error);
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

      const apiInstance = {
        base_url: mapping.base_url,
        api_key: mapping.api_key,
        instance_name: mapping.instance_name,
      };
      if (!apiInstance.base_url || !apiInstance.api_key || !apiInstance.instance_name) {
        return { connected: false, error: 'Instância não encontrada' };
      }

      const service = new EvolutionApiService({
        baseUrl: apiInstance.base_url,
        apiKey: apiInstance.api_key,
        instanceName: apiInstance.instance_name
      });

      // Use getConnectionStatus instead of getInstanceConnectionStatus
      const result = await service.getConnectionStatus();
      return result;
    } catch (error) {
      console.error('❌ [EVOLUTION_API_SENDER] Erro ao verificar status:', error);
      return { connected: false, error: `${error}` };
    }
  };

  return {
    sendMessage,
    generateQRCode,
    checkConnectionStatus,
    sending
  };
};
