
import { useState, useEffect, useCallback } from 'react';
import { MessageService } from '@/services/MessageService';
import { ChannelMessage, RawMessage } from '@/types/messages';
import { evolutionMessageService } from '@/services/EvolutionMessageService';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

export const useChannelMessagesRefactored = (channelId: string, conversationId?: string) => {
  console.log(`[useChannelMessagesRefactored] channelId recebido: ${channelId}`);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertRawToChannelMessage = (raw: RawMessage): ChannelMessage => {
    return {
      id: raw.id.toString(), // Ensure id is a string
      content: raw.content,
      sender: raw.sender,
      timestamp: raw.timestamp,
      type: 'text', // This might need to be dynamic based on raw.mensagemtype
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
    // Adicionando log para verificar se conversationId está presente
    console.log(`[useChannelMessagesRefactored] loadMessages called. channelId: ${channelId}, conversationId: ${conversationId}`);

    try {
      setLoading(true);
      const messageService = new MessageService(channelId);
      
      let result: RawMessage[] | { data: RawMessage[] };
      if (conversationId) {
        // Certifique-se de que conversationId não é undefined antes de chamar
        console.log(`[useChannelMessagesRefactored] Fetching messages by conversation: ${conversationId}`);
        result = await messageService.getMessagesByConversation(conversationId) || [];
      } else {
        console.log(`[useChannelMessagesRefactored] Fetching all messages for channel: ${channelId}`);
        result = await messageService.getAllMessages() || [];
      }

      const rawMessages = Array.isArray(result) ? result : (result?.data || []);
      console.log(`[useChannelMessagesRefactored] Raw messages fetched:`, rawMessages.length);
      const convertedMessages = rawMessages.map(convertRawToChannelMessage);
      setMessages(convertedMessages);
      setError(null);
    } catch (err) {
      console.error('[useChannelMessagesRefactored] Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  useEffect(() => {
    loadMessages();
    
    const interval = setInterval(loadMessages, 5000); // Consider making this configurable or event-driven
    
    // Realtime subscription
    let realtimeChannel: any;
    if (channelId && conversationId) {
      const tableName = MessageService.getTableNameForChannel(channelId);
      console.log(`[useChannelMessagesRefactored] Subscribing to realtime for table: ${tableName}, conversation: ${conversationId}`);
      realtimeChannel = supabase
        .channel(`public:${tableName}:${conversationId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName, filter: `session_id=eq.${conversationId}` },
          (payload) => {
            console.log('[useChannelMessagesRefactored] Realtime event received:', payload);
            loadMessages(); // Reload messages on new event
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[useChannelMessagesRefactored] Successfully subscribed to ${tableName} for ${conversationId}`);
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`[useChannelMessagesRefactored] Realtime subscription error for ${tableName}, ${conversationId}:`, err || status);
          }
        });
    }

    return () => {
      clearInterval(interval);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        console.log(`[useChannelMessagesRefactored] Unsubscribed from realtime for conversation: ${conversationId}`);
      }
    };
  }, [loadMessages, channelId, conversationId]); // Added channelId and conversationId to dependencies

  const addMessage = useCallback((newMessage: RawMessage) => {
    const convertedMessage = convertRawToChannelMessage(newMessage);
    setMessages(prev => [...prev, convertedMessage]);
  }, []);

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
        
        const newMessage: RawMessage = {
          id: Date.now().toString(), // Changed to string
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

      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        let mediaType: 'image' | 'audio' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';
        else if (file.type.startsWith('video/')) mediaType = 'video';

        const result = await evolutionMessageService.sendMediaMessage({
          channelId: channelId,
          phoneNumber: conversationId,
          message: caption || file.name, // Using file.name as caption if not provided
          messageType: 'media',
          mediaUrl: fileData, 
          mediaType: mediaType,
          caption: caption || file.name // Ensure caption is passed if available
        });

        if (result.success) {
          console.log('✅ [SEND_FILE] Arquivo enviado com sucesso:', result.messageId);
          
          const newMessage: RawMessage = {
            id: Date.now().toString(), // Changed to string
            content: caption || `[Arquivo: ${file.name}]`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            session_id: conversationId,
            tipo_remetente: 'agent',
            mensagemtype: mediaType, // Use determined mediaType
            Nome_do_contato: 'Atendente',
            nome_do_contato: 'Atendente'
          };
          
          addMessage(newMessage);
          
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

      const reader = new FileReader();
      reader.onload = async (e) => {
        const audioData = e.target?.result as string;

        const result = await evolutionMessageService.sendMediaMessage({
          channelId: channelId,
          phoneNumber: conversationId,
          message: `Áudio gravado`, // Simplified message
          messageType: 'media',
          mediaUrl: audioData, 
          mediaType: 'audio',
          caption: `Áudio (${Math.round(duration)}s)` // More descriptive caption
        });

        if (result.success) {
          console.log('✅ [SEND_AUDIO] Áudio enviado com sucesso:', result.messageId);
          
          const newMessage: RawMessage = {
            id: Date.now().toString(), // Changed to string
            content: `[Áudio: ${Math.round(duration)}s]`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            session_id: conversationId,
            tipo_remetente: 'agent',
            mensagemtype: 'audio',
            Nome_do_contato: 'Atendente',
            nome_do_contato: 'Atendente'
          };
          
          addMessage(newMessage);
          
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

  return {
    messages,
    loading,
    error,
    refetch: loadMessages,
    addMessage,
    sendMessage,
    sendFile,
    sendAudio
  };
};
