
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { evolutionApiManager } from '@/services/EvolutionApiService';
import { channelWebSocketManager } from '@/services/ChannelWebSocketManager';
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

  const sendMessage = useCallback(async (messageData: EvolutionMessageData) => {
    setSending(true);
    try {
      console.log('🚀 [EVOLUTION_SENDER] Iniciando envio de mensagem:', {
        channelId: messageData.channelId,
        conversationId: messageData.conversationId,
        messageType: messageData.messageType || 'text'
      });

      // Buscar configuração da instância para o canal
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', messageData.channelId)
        .eq('is_active', true)
        .single();

      if (mappingError || !mapping) {
        const errorMsg = `Nenhuma instância da Evolution API configurada para o canal: ${messageData.channelId}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        throw new Error(errorMsg);
      }

      const instanceConfig = {
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        instanceName: mapping.instance_name
      };

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

      // Salvar mensagem no banco de dados
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
      
      // Buscar configuração da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .single();

      if (mappingError || !mapping) {
        const errorMsg = `Nenhuma instância da Evolution API configurada para o canal ${channelId}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        
        toast({
          title: "Configuração Necessária",
          description: "Configure a instância da Evolution API nas configurações",
          variant: "destructive"
        });
        
        return { success: false, error: errorMsg };
      }
      
      const instanceConfig = {
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        instanceName: mapping.instance_name
      };
      
      const service = evolutionApiManager.getInstanceByConfig(instanceConfig);
      
      if (!service) {
        const errorMsg = `Serviço da Evolution API não encontrado para instância: ${instanceConfig.instanceName}`;
        console.error('❌ [EVOLUTION_SENDER]', errorMsg);
        return { success: false, error: errorMsg };
      }
      
      console.log('🚀 [EVOLUTION_SENDER] Verificando status da instância antes de gerar QR...');
      const status = await service.getConnectionStatus();
      
      if (status?.state === 'open') {
        console.log('✅ [EVOLUTION_SENDER] Instância já conectada, iniciando WebSocket...');
        
        // Inicializar WebSocket para receber mensagens
        await channelWebSocketManager.initializeChannelWebSocket(channelId, {
          baseUrl: mapping.base_url,
          apiKey: mapping.api_key,
          instanceName: mapping.instance_name,
          channelId
        });
        
        toast({
          title: "Sucesso",
          description: "Instância conectada e pronta para receber mensagens",
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
      // Verificar se há WebSocket ativo para o canal
      const isWebSocketConnected = channelWebSocketManager.isChannelConnected(channelId);
      
      if (isWebSocketConnected) {
        return { state: 'open', websocket: true };
      }

      // Verificar status da instância na Evolution API
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .single();

      if (mappingError || !mapping) {
        console.warn('⚠️ [EVOLUTION_SENDER] Nenhuma instância configurada para canal:', channelId);
        return { state: 'close' };
      }
      
      const instanceConfig = {
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        instanceName: mapping.instance_name
      };
      
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

  // Função para inicializar WebSocket após conectar instância
  const initializeWebSocketForChannel = useCallback(async (channelId: string) => {
    try {
      const { data: mapping, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .single();

      if (error || !mapping) {
        throw new Error('Configuração da instância não encontrada');
      }

      const result = await channelWebSocketManager.initializeChannelWebSocket(channelId, {
        baseUrl: mapping.base_url,
        apiKey: mapping.api_key,
        instanceName: mapping.instance_name,
        channelId
      });

      if (result.success) {
        toast({
          title: "WebSocket Conectado",
          description: "Canal pronto para receber mensagens em tempo real",
        });
      }

      return result;
    } catch (error) {
      console.error('❌ [EVOLUTION_SENDER] Erro ao inicializar WebSocket:', error);
      return { success: false, error: `${error}` };
    }
  }, [toast]);

  return {
    sendMessage,
    generateQRCode,
    checkConnectionStatus,
    initializeWebSocketForChannel,
    sending
  };
};

// Função auxiliar para extrair número de telefone do conversationId
function extractPhoneFromConversationId(conversationId: string): string | null {
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
    
    const messageRecord: any = {
      session_id: messageData.conversationId,
      message: messageData.content,
      tipo_remetente: 'USUARIO_INTERNO',
      mensagemtype: messageData.messageType || 'text',
      read_at: new Date().toISOString(),
      is_read: true
    };

    // Adicionar campo de contato específico por canal
    const contactField = getContactFieldForChannel(messageData.channelId);
    messageRecord[contactField] = messageData.agentName || 'Atendente';

    // Adicionar base64 se for mídia
    if (messageData.fileBase64) {
      messageRecord.media_base64 = messageData.fileBase64;
    }

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

function getContactFieldForChannel(channelId: string): string {
  const channelToContactFieldMap: Record<string, string> = {
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Nome_do_contato',
    '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'nome_do_contato',
    'b7996f75-41a7-4725-8229-564f31868027': 'nome_do_contato',
    '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'nome_do_contato',
    '64d8acad-c645-4544-a1e6-2f0825fae00b': 'nome_do_contato',
    'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'nome_do_contato',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'Nome_do_contato'
  };
  
  const nameToContactFieldMap: Record<string, string> = {
    'chat': 'Nome_do_contato',
    'canarana': 'nome_do_contato',
    'souto-soares': 'nome_do_contato',
    'joao-dourado': 'nome_do_contato',
    'america-dourada': 'nome_do_contato',
    'gerente-lojas': 'nome_do_contato',
    'gerente-externo': 'Nome_do_contato'
  };
  
  return channelToContactFieldMap[channelId] || nameToContactFieldMap[channelId] || 'nome_do_contato';
}
