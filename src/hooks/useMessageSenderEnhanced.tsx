
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingService';
import { MessageSenderEnhanced } from '@/services/MessageSenderEnhanced';
import { MediaProcessor } from '@/services/MediaProcessor';

export interface MessageDataEnhanced {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video';
  fileBase64?: string;
  fileName?: string;
}

type TableName = 
  | 'yelena_ai_conversas'
  | 'canarana_conversas'
  | 'souto_soares_conversas'
  | 'joao_dourado_conversas'
  | 'america_dourada_conversas'
  | 'gerente_lojas_conversas'
  | 'gerente_externo_conversas';

export const useMessageSenderEnhanced = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const channelApiMappingService = new ChannelApiMappingService();

  const sendMessage = async (messageData: MessageDataEnhanced) => {
    setSending(true);
    try {
      console.log('🚀 [USE_MESSAGE_SENDER_ENHANCED] Iniciando envio:', {
        channelId: messageData.channelId,
        conversationId: messageData.conversationId,
        messageType: messageData.messageType || 'text',
        hasFileBase64: !!messageData.fileBase64
      });
      
      const apiInstance = await channelApiMappingService.getApiInstanceForChannel(messageData.channelId);
      
      if (!apiInstance) {
        throw new Error(`Nenhuma instância da API configurada para o canal ${messageData.channelId}`);
      }
      
      const messageSender = new MessageSenderEnhanced(
        apiInstance.api_key,
        apiInstance.base_url
      );
      
      const tableName = getTableNameForChannel(messageData.channelId);
      const messageType = messageData.messageType || 'text';
      let success = false;
      
      if (messageType === 'text') {
        success = await messageSender.sendTextMessage(
          apiInstance.instance_name,
          messageData.conversationId,
          messageData.content
        );
      } else {
        let mediaContent = messageData.fileBase64 || messageData.content;
        
        const processedMedia = MediaProcessor.process(mediaContent, messageType);
        
        if (!processedMedia.isProcessed || processedMedia.error) {
          throw new Error('Erro ao processar mídia');
        }
        
        success = await messageSender.sendMediaMessage(
          apiInstance.instance_name,
          messageData.conversationId,
          processedMedia.url,
          messageData.content,
          messageType as any
        );
      }
      
      if (!success) {
        throw new Error('Falha ao enviar mensagem');
      }
      
      await messageSender.saveMessageToDatabase(
        tableName,
        messageData.conversationId,
        messageData.content,
        messageType,
        messageData.agentName || 'Atendente'
      );
      
      const typeMessages = {
        text: 'Mensagem enviada',
        file: 'Arquivo enviado',
        audio: 'Áudio enviado',
        image: 'Imagem enviada',
        video: 'Vídeo enviado'
      };
      
      toast({
        title: "Sucesso",
        description: typeMessages[messageType as keyof typeof typeMessages] + " com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('❌ [USE_MESSAGE_SENDER_ENHANCED] Erro:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setSending(false);
    }
  };
  
  const generateQRCode = async (channelId: string) => {
    try {
      console.log('🔄 [QR_CODE] Gerando para canal:', channelId);
      
      const apiInstance = await channelApiMappingService.getApiInstanceForChannel(channelId);
      
      if (!apiInstance) {
        throw new Error(`Nenhuma instância da API configurada para o canal ${channelId}`);
      }
      
      console.log('✅ [QR_CODE] API encontrada:', {
        instanceName: apiInstance.instance_name,
        baseUrl: apiInstance.base_url
      });
      
      const messageSender = new MessageSenderEnhanced(
        apiInstance.api_key,
        apiInstance.base_url
      );
      
      const result = await messageSender.generateQRCode(apiInstance.instance_name);
      
      if (result.error) {
        console.error('❌ [QR_CODE] Erro da API:', result.error);
        throw new Error(result.error);
      }
      
      console.log('✅ [QR_CODE] Gerado com sucesso');
      return result;
    } catch (error) {
      console.error('❌ [QR_CODE] Erro:', error);
      
      toast({
        title: "Erro",
        description: `Erro ao gerar QR code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
      
      return { error: `Erro ao gerar QR code: ${error}` };
    }
  };

  return {
    sendMessage,
    generateQRCode,
    sending
  };
};

const getTableNameForChannel = (channelId: string): TableName => {
  const channelToTableMap: Record<string, TableName> = {
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
    '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
    'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
    '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
    '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
    'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
  };
  
  const nameToTableMap: Record<string, TableName> = {
    'chat': 'yelena_ai_conversas',
    'canarana': 'canarana_conversas',
    'souto-soares': 'souto_soares_conversas',
    'joao-dourado': 'joao_dourado_conversas',
    'america-dourada': 'america_dourada_conversas',
    'gerente-lojas': 'gerente_lojas_conversas',
    'gerente-externo': 'gerente_externo_conversas'
  };
  
  return channelToTableMap[channelId] || nameToTableMap[channelId] || 'yelena_ai_conversas';
};
