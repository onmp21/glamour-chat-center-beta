import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { N8nMessagingService } from '@/services/N8nMessagingService';
import { supabase } from '@/integrations/supabase/client';

export const useMessageSender = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (channelId: string, phoneNumber: string, message: string) => {
    setSending(true);
    try {
      // Buscar mapping do canal para obter informações da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        throw new Error('Mapping não encontrado para o canal');
      }

      // Enviar via N8N
      const result = await N8nMessagingService.sendTextMessage(
        mapping.channel_name,
        mapping.instance_name,
        phoneNumber,
        message
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso",
        });
        return true;
      } else {
        throw new Error(result.error || "Falha ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
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

  const sendMediaMessage = async (
    channelId: string, 
    phoneNumber: string, 
    mediaContent: string, 
    caption?: string,
    mediaType: 'image' | 'audio' | 'video' | 'document' = 'image',
    fileName?: string
  ) => {
    setSending(true);
    try {
      // Buscar mapping do canal para obter informações da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        throw new Error('Mapping não encontrado para o canal');
      }

      // Enviar via N8N
      const result = await N8nMessagingService.sendMediaMessage(
        mapping.channel_name,
        mapping.instance_name,
        phoneNumber,
        mediaContent,
        caption || "",
        mediaType,
        fileName
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Mídia enviada com sucesso",
        });
        return true;
      } else {
        throw new Error(result.error || "Falha ao enviar mídia");
      }
    } catch (error) {
      console.error("Erro ao enviar mídia:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mídia",
        variant: "destructive"
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    sendMessage,
    sendMediaMessage,
    sending
  };
};

