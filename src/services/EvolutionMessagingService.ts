import { ChannelMappingRepository } from '../repositories/ChannelMappingRepository';
import { N8nMessagingService } from './N8nMessagingService';
import { supabase } from '@/integrations/supabase/client';

export class EvolutionMessagingService {
  /**
   * Envia mensagem via N8N (novo sistema)
   */
  static async sendMessageViaEvolution(
    channelId: string,
    conversationId: string,
    content: string,
    mediaUrl?: string
  ): Promise<boolean> {
    try {
      console.log('📤 [EVOLUTION_MESSAGING] Enviando mensagem via N8N:', {
        channelId,
        conversationId,
        hasMedia: !!mediaUrl
      });

      // Buscar mapping do canal para obter informações da instância
      const { data: mapping, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (mappingError || !mapping) {
        console.error('❌ [EVOLUTION_MESSAGING] Mapping não encontrado para canal:', channelId);
        return false;
      }

      // Determinar tipo de mensagem
      if (mediaUrl) {
        // Mensagem de mídia
        const result = await N8nMessagingService.sendMediaMessage(
          mapping.channel_name,
          mapping.instance_name,
          conversationId,
          mediaUrl,
          content,
          'image' // Assumindo imagem por padrão, pode ser melhorado
        );
        return result.success;
      } else {
        // Mensagem de texto
        const result = await N8nMessagingService.sendTextMessage(
          mapping.channel_name,
          mapping.instance_name,
          conversationId,
          content
        );
        return result.success;
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGING] Erro ao enviar mensagem:', error);
      return false;
    }
  }

  /**
   * Método legado mantido para compatibilidade (deprecado)
   * @deprecated Use sendMessageViaEvolution que agora usa N8N
   */
  static async sendMessageViaEvolutionLegacy(
    channelId: string,
    conversationId: string,
    content: string,
    mediaUrl?: string
  ): Promise<boolean> {
    console.warn('⚠️ [EVOLUTION_MESSAGING] Método legado chamado, redirecionando para N8N');
    return this.sendMessageViaEvolution(channelId, conversationId, content, mediaUrl);
  }
}

