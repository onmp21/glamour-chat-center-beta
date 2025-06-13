import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChannelApiMappingService } from '@/services/ChannelApiMappingService';
import { MediaProcessor } from '@/services/MediaProcessor';

export interface MessageData {
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

export const useMessageSender = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const channelApiMappingService = new ChannelApiMappingService();

  // Webhook removido conforme solicitação do usuário
  // Agora o envio será feito diretamente pela API Evolution

  const sendViaEvolutionAPI = async (messageData: MessageData): Promise<boolean> => {
    try {
      // Verificar se há uma instância da API configurada para este canal
      const apiInstance = await channelApiMappingService.getApiInstanceForChannel(messageData.channelId);
      
      if (!apiInstance) {
        console.log('⚠️ Nenhuma instância da API Evolution configurada para este canal');
        return false;
      }
      
      console.log('🚀 Enviando mensagem via API Evolution');
      
      // Determinar se é mensagem de texto ou mídia
      let mediaUrl: string | undefined;
      
      if (messageData.fileBase64) {
        mediaUrl = messageData.fileBase64;
      } else if (messageData.messageType && messageData.messageType !== 'text') {
        // Verificar se o conteúdo parece ser base64
        if (MediaProcessor.looksLikeBase64(messageData.content)) {
          // Converter para data URL se necessário
          if (!messageData.content.startsWith('data:')) {
            const mimeType = getMimeTypeFromMessageType(messageData.messageType);
            mediaUrl = `data:${mimeType};base64,${messageData.content}`;
          } else {
            mediaUrl = messageData.content;
          }
        }
      }
      
      // Enviar a mensagem
      const success = await channelApiMappingService.sendMessageViaEvolution(
        messageData.channelId,
        messageData.conversationId,
        messageData.content,
        mediaUrl
      );
      
      if (success) {
        console.log('✅ Mensagem enviada com sucesso via API Evolution');
      } else {
        console.error('❌ Falha ao enviar mensagem via API Evolution');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via API Evolution:', error);
      return false;
    }
  };

  const sendMessage = async (messageData: MessageData) => {
    setSending(true);
    console.log(`🔍 [USE_MESSAGE_SENDER] Dados da mensagem recebidos:`, messageData);
    try {
      const tableName = getTableNameForChannel(messageData.channelId);
      
      // Criar o objeto de inserção base
      const insertData: any = {
        session_id: `agent_${messageData.conversationId}_${Date.now()}`,
        message: messageData.content,
        read_at: new Date().toISOString()
      };

      // Tentar adicionar Nome_do_contato se a tabela suportar
      try {
        insertData.Nome_do_contato = messageData.agentName || 'Atendente';
        
        const { error } = await supabase
          .from(tableName)
          .insert(insertData);

        if (error) {
          throw error;
        }
      } catch (error: any) {
        // Se der erro (coluna não existe), tentar sem a coluna Nome_do_contato
        if (error.message?.includes('Nome_do_contato')) {
          console.log('Coluna Nome_do_contato não existe, inserindo sem ela');
          delete insertData.Nome_do_contato;
          
          const { error: fallbackError } = await supabase
            .from(tableName)
            .insert(insertData);

          if (fallbackError) {
            throw fallbackError;
          }
        } else {
          throw error;
        }
      }

      // Tentar enviar via API Evolution
      const evolutionSuccess = await sendViaEvolutionAPI(messageData);
      
      if (!evolutionSuccess) {
        console.error('❌ Falha ao enviar mensagem via API Evolution');
        throw new Error('Falha ao enviar mensagem via API Evolution');
      }

      const messageType = messageData.messageType || 'text';
      const typeMessages = {
        text: 'Mensagem enviada',
        file: 'Arquivo enviado',
        audio: 'Áudio enviado',
        image: 'Imagem enviada',
        video: 'Vídeo enviado'
      };

      toast({
        title: "Sucesso",
        description: typeMessages[messageType] + " com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

  return {
    sendMessage,
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

const getChannelDisplayName = (channelId: string): string => {
  const channelDisplayMap: Record<string, string> = {
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Óticas Villa Glamour',
    '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana',
    'b7996f75-41a7-4725-8229-564f31868027': 'souto-soares',
    '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao-dourado',
    '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america-dourada',
    'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente-lojas',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'andressa',
    'chat': 'Óticas Villa Glamour',
    'canarana': 'canarana',
    'souto-soares': 'souto-soares',
    'joao-dourado': 'joao-dourado',
    'america-dourada': 'america-dourada',
    'gerente-lojas': 'gerente-lojas',
    'gerente-externo': 'andressa'
  };
  
  return channelDisplayMap[channelId] || 'Óticas Villa Glamour';
};

const getMimeTypeFromMessageType = (messageType: string): string => {
  switch (messageType.toLowerCase()) {
    case 'audio':
      return 'audio/mpeg';
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'file':
    case 'document':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

