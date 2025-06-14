import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';
<<<<<<< HEAD
import { evolutionMessageService } from '@/services/EvolutionMessageService';
=======
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0

export const useChannelMessagesRefactored = (channelId: string, conversationId?: string) => {
  console.log(`[useChannelMessagesRefactored] channelId recebido: ${channelId}`);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertRawToChannelMessage = (raw: RawMessage): ChannelMessage => {
    return {
      id: raw.id.toString(),
      content: raw.content,
      sender: raw.sender,
      timestamp: raw.timestamp,
      type: 'text',
      isFromUser: raw.sender === 'customer',
      session_id: raw.session_id,
      tipo_remetente: raw.tipo_remetente,
      mensagemtype: raw.mensagemtype,
      Nome_do_contato: raw.Nome_do_contato,
      nome_do_contato: raw.nome_do_contato
    };
  };

  const loadMessages = useCallback(async () => {
    if (!channelId) return;

    try {
      setLoading(true);
      const messageService = new MessageService(channelId);
      
      let result: RawMessage[] | { data: RawMessage[] };
      if (conversationId) {
        result = await messageService.getMessagesByConversation(conversationId) || [];
      } else {
        result = await messageService.getAllMessages() || [];
      }

      const rawMessages = Array.isArray(result) ? result : (result?.data || []);
      const convertedMessages = rawMessages.map(convertRawToChannelMessage);
      setMessages(convertedMessages);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  useEffect(() => {
    loadMessages();
    
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const addMessage = useCallback((newMessage: RawMessage) => {
    const convertedMessage = convertRawToChannelMessage(newMessage);
    setMessages(prev => [...prev, convertedMessage]);
  }, []);
<<<<<<< HEAD

  // Função para enviar mensagem de texto
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!channelId || !conversationId || !message.trim()) {
      console.error('❌ [SEND_MESSAGE] Parâmetros inválidos:', { channelId, conversationId, message });
      throw new Error('Canal, conversa ou mensagem inválidos');
    }

    try {
      console.log('📤 [SEND_MESSAGE] Enviando mensagem:', { channelId, conversationId, message });

      const result = await evolutionMessageService.sendTextMessage({
        channelId: channelId,
        phoneNumber: conversationId,
        message: message
      });

      if (result.success) {
        console.log('✅ [SEND_MESSAGE] Mensagem enviada com sucesso:', result.messageId);
        
        // Adicionar mensagem localmente para feedback imediato
        const newMessage: RawMessage = {
          id: Date.now(),
          content: message,
          sender: 'agent',
          timestamp: new Date().toISOString(),
          session_id: conversationId,
          tipo_remetente: 'agent',
          mensagemtype: 'text',
          Nome_do_contato: 'Atendente',
          nome_do_contato: 'Atendente'
        };
        
        addMessage(newMessage);
        
        // Recarregar mensagens após um breve delay
        setTimeout(() => {
          loadMessages();
        }, 1000);
      } else {
        console.error('❌ [SEND_MESSAGE] Erro ao enviar mensagem:', result.error);
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('❌ [SEND_MESSAGE] Erro inesperado:', error);
      throw error;
    }
  }, [channelId, conversationId, addMessage, loadMessages]);

  // Função para enviar arquivo
  const sendFile = useCallback(async (file: File, caption?: string): Promise<void> => {
    if (!channelId || !conversationId) {
      console.error('❌ [SEND_FILE] Parâmetros inválidos:', { channelId, conversationId });
      throw new Error('Canal ou conversa inválidos');
    }

    try {
      console.log('📤 [SEND_FILE] Enviando arquivo:', { channelId, conversationId, fileName: file.name });

      // Converter arquivo para base64 ou URL (implementação simplificada)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        // Determinar tipo de mídia
        let mediaType: 'image' | 'audio' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';
        else if (file.type.startsWith('video/')) mediaType = 'video';

        const result = await evolutionMessageService.sendMediaMessage({
          channelId: channelId,
          phoneNumber: conversationId,
          message: caption || `[${file.name}]`,
          messageType: 'media',
          mediaUrl: fileData,
          mediaType: mediaType,
          caption: caption
        });

        if (result.success) {
          console.log('✅ [SEND_FILE] Arquivo enviado com sucesso:', result.messageId);
          
          // Adicionar mensagem localmente
          const newMessage: RawMessage = {
            id: Date.now(),
            content: caption || `[Arquivo: ${file.name}]`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            session_id: conversationId,
            tipo_remetente: 'agent',
            mensagemtype: mediaType,
            Nome_do_contato: 'Atendente',
            nome_do_contato: 'Atendente'
          };
          
          addMessage(newMessage);
          
          // Recarregar mensagens
          setTimeout(() => {
            loadMessages();
          }, 1000);
        } else {
          console.error('❌ [SEND_FILE] Erro ao enviar arquivo:', result.error);
          throw new Error(result.error || 'Erro ao enviar arquivo');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ [SEND_FILE] Erro inesperado:', error);
      throw error;
    }
  }, [channelId, conversationId, addMessage, loadMessages]);

  // Função para enviar áudio
  const sendAudio = useCallback(async (audioBlob: Blob, duration: number): Promise<void> => {
    if (!channelId || !conversationId) {
      console.error('❌ [SEND_AUDIO] Parâmetros inválidos:', { channelId, conversationId });
      throw new Error('Canal ou conversa inválidos');
    }

    try {
      console.log('📤 [SEND_AUDIO] Enviando áudio:', { channelId, conversationId, duration });

      // Converter blob para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const audioData = e.target?.result as string;

        const result = await evolutionMessageService.sendMediaMessage({
          channelId: channelId,
          phoneNumber: conversationId,
          message: `[Áudio - ${duration}s]`,
          messageType: 'media',
          mediaUrl: audioData,
          mediaType: 'audio',
          caption: `Áudio de ${duration} segundos`
        });

        if (result.success) {
          console.log('✅ [SEND_AUDIO] Áudio enviado com sucesso:', result.messageId);
          
          // Adicionar mensagem localmente
          const newMessage: RawMessage = {
            id: Date.now(),
            content: `[Áudio - ${duration}s]`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            session_id: conversationId,
            tipo_remetente: 'agent',
            mensagemtype: 'audio',
            Nome_do_contato: 'Atendente',
            nome_do_contato: 'Atendente'
          };
          
          addMessage(newMessage);
          
          // Recarregar mensagens
          setTimeout(() => {
            loadMessages();
          }, 1000);
        } else {
          console.error('❌ [SEND_AUDIO] Erro ao enviar áudio:', result.error);
          throw new Error(result.error || 'Erro ao enviar áudio');
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ [SEND_AUDIO] Erro inesperado:', error);
      throw error;
    }
  }, [channelId, conversationId, addMessage, loadMessages]);
=======
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0

  return {
    messages,
    loading,
    error,
    refetch: loadMessages,
<<<<<<< HEAD
    addMessage,
    sendMessage,
    sendFile,
    sendAudio
=======
    addMessage
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0
  };
};

