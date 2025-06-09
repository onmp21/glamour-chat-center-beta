import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { evolutionApiManager } from '@/services/EvolutionApiService';
import { ChannelInstanceMappingService } from '@/services/ChannelInstanceMappingService';
import { WebhookConfigurationService } from '@/services/WebhookConfigurationService';
import { supabase } from '@/integrations/supabase/client';

export interface EvolutionMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker';
  fileBase64?: string;
  fileName?: string;
}

export const useEvolutionApiSender = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const channelMappingService = new ChannelInstanceMappingService();

  const sendMessage = useCallback(async (messageData: EvolutionMessageData) => {
    setSending(true);
    try {
      console.log('🚀 [EVOLUTION_SENDER] Iniciando envio de mensagem:', {
        channelId: messageData.channelId,
        conversationId: messageData.conversationId,
        messageType: messageData.messageType || 'text'
      });

      const instanceConfig = await channelMappingService.getEvolutionInstanceForChannel(messageData.channelId);
      
      if (!instanceConfig) {
        const errorMsg = `Nenhuma instância da Evolution API configurada para o canal: ${messageData.channelId}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ [EVOLUTION_SENDER] Instância encontrada:', instanceConfig.instanceName);

      const service = evolutionApiManager.getInstanceByConfig(instanceConfig);
      if (!service) {
        const errorMsg = `Serviço da Evolution API não encontrado para instância: ${instanceConfig.instanceName}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        throw new Error(errorMsg);
      }

      const phoneNumber = extractPhoneFromConversationId(messageData.conversationId);
      
      if (!phoneNumber) {
        throw new Error('Não foi possível extrair o número de telefone da conversa');
      }

      let result;
      const messageType = messageData.messageType || 'text';

      switch (messageType) {
        case 'text':
          result = await service.sendTextMessage(phoneNumber, messageData.content);
          break;
          
        case 'image':
          if (!messageData.fileBase64) {
            throw new Error('Base64 da imagem é obrigatório');
          }
          result = await service.sendMediaMessage(
            phoneNumber,
            messageData.fileBase64,
            'image',
            messageData.content,
            messageData.fileName
          );
          break;
          
        case 'audio':
          if (!messageData.fileBase64) {
            throw new Error('Base64 do áudio é obrigatório');
          }
          result = await service.sendMediaMessage(
            phoneNumber,
            messageData.fileBase64,
            'audio'
          );
          break;
          
        case 'video':
          if (!messageData.fileBase64) {
            throw new Error('Base64 do vídeo é obrigatório');
          }
          result = await service.sendMediaMessage(
            phoneNumber,
            messageData.fileBase64,
            'video',
            messageData.content,
            messageData.fileName
          );
          break;
          
        case 'document':
          if (!messageData.fileBase64) {
            throw new Error('Base64 do documento é obrigatório');
          }
          result = await service.sendMediaMessage(
            phoneNumber,
            messageData.fileBase64,
            'document',
            messageData.content,
            messageData.fileName
          );
          break;
          
        case 'sticker':
          if (!messageData.fileBase64) {
            throw new Error('Base64 da figurinha é obrigatório');
          }
          result = await service.sendSticker(phoneNumber, messageData.fileBase64);
          break;
          
        default:
          throw new Error(`Tipo de mensagem não suportado: ${messageType}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      console.log('✅ [EVOLUTION_SENDER] Mensagem enviada com sucesso:', result);

      await saveMessageToDatabase(messageData, result.messageId);

      const typeMessages = {
        text: 'Mensagem enviada',
        image: 'Imagem enviada',
        audio: 'Áudio enviado',
        video: 'Vídeo enviado',
        document: 'Documento enviado',
        sticker: 'Figurinha enviada'
      };

      toast({
        title: "Sucesso",
        description: typeMessages[messageType] + " com sucesso",
      });

      return true;
    } catch (error) {
      console.error('❌ [EVOLUTION_SENDER] Erro ao enviar mensagem:', error);
      
      toast({
        title: "Erro",
        description: `Erro ao enviar mensagem: ${error}`,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setSending(false);
    }
  }, [toast]);

  const generateQRCode = useCallback(async (channelId: string) => {
    try {
      console.log('🔄 [EVOLUTION_SENDER] Gerando QR code para canal:', channelId);
      
      const instanceConfig = await channelMappingService.getEvolutionInstanceForChannel(channelId);
      
      if (!instanceConfig) {
        const errorMsg = `Nenhuma instância da Evolution API configurada para o canal ${channelId}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        
        toast({
          title: "Configuração Necessária",
          description: "Configure a instância da Evolution API nas configurações",
          variant: "destructive"
        });
        
        return { success: false, error: errorMsg };
      }
      
      const service = evolutionApiManager.getInstanceByConfig(instanceConfig);
      
      if (!service) {
        const errorMsg = `Serviço da Evolution API não encontrado para instância: ${instanceConfig.instanceName}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        return { success: false, error: errorMsg };
      }
      
      console.log('🚀 [EVOLUTION_SENDER] Verificando status da instância antes de gerar QR...');
      const status = await service.getConnectionStatus();
      
      if (status?.state === 'open') {
        console.log('✅ [EVOLUTION_SENDER] Instância já conectada, configurando webhook...');
        
        toast({
          title: "Sucesso",
          description: "Instância já conectada",
        });
        
        return { 
          success: true, 
          qrCode: null, 
          message: 'Instância já conectada',
          connected: true 
        };
      }
      
      console.log('🔄 [EVOLUTION_SENDER] Obtendo QR code...');
      const result = await service.getQRCode();
      
      if (!result.success) {
        console.error('❌ [EVOLUTION_SENDER] Erro ao gerar QR code:', result.error);
        
        toast({
          title: "Erro",
          description: `Erro ao gerar QR code: ${result.error}`,
          variant: "destructive"
        });
        
        return result;
      }
      
      console.log('✅ [EVOLUTION_SENDER] QR code gerado com sucesso');
      
      return result;
    } catch (error) {
      console.error('❌ [EVOLUTION_SENDER] Erro ao gerar QR code:', error);
      
      toast({
        title: "Erro",
        description: `Erro ao gerar QR code: ${error}`,
        variant: "destructive"
      });
      
      return { success: false, error: `${error}` };
    }
  }, [toast]);

  const checkConnectionStatus = useCallback(async (channelId: string) => {
    try {
      const instanceConfig = await channelMappingService.getEvolutionInstanceForChannel(channelId);
      
      if (!instanceConfig) {
        console.warn('⚠️ [EVOLUTION_SENDER] Nenhuma instância configurada para canal:', channelId);
        return { state: 'close' };
      }
      
      const service = evolutionApiManager.getInstanceByConfig(instanceConfig);
      
      if (!service) {
        console.warn('⚠️ [EVOLUTION_SENDER] Serviço não encontrado para instância:', instanceConfig.instanceName);
        return { state: 'close' };
      }
      
      const status = await service.getConnectionStatus();
      console.log('📡 [EVOLUTION_SENDER] Status da conexão:', status);
      return status || { state: 'close' };
    } catch (error) {
      console.error('❌ [EVOLUTION_SENDER] Erro ao verificar status:', error);
      return { state: 'close' };
    }
  }, []);

  return {
    sendMessage,
    generateQRCode,
    checkConnectionStatus,
    sending
  };
};

// Função auxiliar para extrair número de telefone do conversationId
function extractPhoneFromConversationId(conversationId: string): string | null {
  // Assumindo que o conversationId contém o número de telefone
  // Pode ser no formato: "5511999999999" ou "5511999999999_timestamp" ou similar
  
  // Extrair apenas números
  const numbers = conversationId.replace(/\D/g, '');
  
  // Verificar se tem pelo menos 10 dígitos (número brasileiro mínimo)
  if (numbers.length >= 10) {
    // Se começar com 55 (código do Brasil), usar como está
    if (numbers.startsWith('55')) {
      return numbers;
    }
    // Se não, adicionar código do Brasil
    return `55${numbers}`;
  }
  
  return null;
}

// Função auxiliar para salvar mensagem no banco
async function saveMessageToDatabase(messageData: EvolutionMessageData, messageId?: string) {
  try {
    const tableName = getTableNameForChannel(messageData.channelId);
    
    const messageRecord = {
      session_id: messageData.conversationId,
      message: messageData.content,
      tipo_remetente: messageData.sender,
      nome_do_contato: messageData.agentName || 'Atendente',
      mensagemtype: messageData.messageType || 'text',
      created_at: new Date().toISOString(),
      evolution_message_id: messageId
    };

    const { error } = await supabase
      .from(tableName as any)
      .insert([messageRecord]);

    if (error) {
      console.error('❌ [EVOLUTION_SENDER] Erro ao salvar mensagem no banco:', error);
      throw error;
    }

    console.log('✅ [EVOLUTION_SENDER] Mensagem salva no banco de dados');
  } catch (error) {
    console.error('❌ [EVOLUTION_SENDER] Erro ao salvar mensagem:', error);
    throw error;
  }
}

// Função auxiliar para mapear canal para tabela
function getTableNameForChannel(channelId: string): string {
  const channelToTableMap: Record<string, string> = {
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
    '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
    'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
    '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
    '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
    'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
  };
  
  const nameToTableMap: Record<string, string> = {
    'chat': 'yelena_ai_conversas',
    'canarana': 'canarana_conversas',
    'souto-soares': 'souto_soares_conversas',
    'joao-dourado': 'joao_dourado_conversas',
    'america-dourada': 'america_dourada_conversas',
    'gerente-lojas': 'gerente_lojas_conversas',
    'gerente-externo': 'gerente_externo_conversas'
  };
  
  return channelToTableMap[channelId] || nameToTableMap[channelId] || 'yelena_ai_conversas';
}
