
import { supabase } from "../lib/supabase";
import { RawMessage } from '@/types/messageTypes';
import { ChannelUuidResolver } from './ChannelUuidResolver';
import { getBrazilianTimestamp } from '@/utils/timestampUtils';

export class ChannelMessagePersistence {
  static async saveMessageToChannel(channelId: string, message: RawMessage): Promise<void> {
    const tableMapping: Record<string, string> = {
      // UUIDs padrão dos canais
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
      // Nomes legados
      'yelena': 'yelena_ai_conversas',
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };

    const tableName = tableMapping[channelId] || tableMapping[await ChannelUuidResolver.getChannelUuid(channelId) || ''] || 'yelena_ai_conversas';
    if (!tableName) {
      console.error(`[CHANNEL_MESSAGE_PERSISTENCE] No table mapping found for channel: ${channelId}`);
      throw new Error('Canal não encontrado para salvar mensagens');
    }

    // Construir a mensagem para o banco - ESTRUTURA PADRONIZADA
    const dbMessage: any = {
      session_id: message.session_id,
      message: message.message,
      read_at: message.read_at || getBrazilianTimestamp(),
      nome_do_contato: message.nome_do_contato || message.Nome_do_contato || "Atendente",
      mensagemtype: message.mensagemtype || "text",
      tipo_remetente: message.tipo_remetente,
      is_read: message.is_read || false
    };

    // LÓGICA SIMPLIFICADA: Detectar tipo de mensagem baseado no conteúdo
    if (dbMessage.message && typeof dbMessage.message === "string" && dbMessage.message.trim() !== "") {
      const messageContent = dbMessage.message.trim();
      
      // Se contém data URL, definir tipo baseado no mime type
      if (messageContent.startsWith('data:')) {
        const lowerContent = messageContent.toLowerCase();
        if (lowerContent.includes('image') || lowerContent.match(/data:image\//)) {
          dbMessage.mensagemtype = "image";
          if (!dbMessage.message || dbMessage.message.trim() === messageContent) {
            dbMessage.message = messageContent; // Manter o data URL na mensagem
          }
        } else if (lowerContent.includes('audio') || lowerContent.match(/data:audio\//)) {
          dbMessage.mensagemtype = "audio";
          if (!dbMessage.message || dbMessage.message.trim() === messageContent) {
            dbMessage.message = messageContent;
          }
        } else if (lowerContent.includes('video') || lowerContent.match(/data:video\//)) {
          dbMessage.mensagemtype = "video";
          if (!dbMessage.message || dbMessage.message.trim() === messageContent) {
            dbMessage.message = messageContent;
          }
        } else if (lowerContent.includes('application') || lowerContent.match(/data:application\//)) {
          dbMessage.mensagemtype = "document";
          if (!dbMessage.message || dbMessage.message.trim() === messageContent) {
            dbMessage.message = messageContent;
          }
        } else {
          dbMessage.mensagemtype = "file";
        }

        console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Media message detected. Type: ${dbMessage.mensagemtype}`);
      } else if (messageContent.startsWith('http') && (messageContent.includes('supabase.co/storage') || messageContent.includes('media'))) {
        // URL de mídia externa
        const lowerUrl = messageContent.toLowerCase();
        if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/)) {
          dbMessage.mensagemtype = "image";
        } else if (lowerUrl.match(/\.(mp3|ogg|wav|m4a)($|\?)/)) {
          dbMessage.mensagemtype = "audio";
        } else if (lowerUrl.match(/\.(mp4|avi|mov|wmv)($|\?)/)) {
          dbMessage.mensagemtype = "video";
        } else if (lowerUrl.match(/\.(pdf|doc|docx|txt)($|\?)/)) {
          dbMessage.mensagemtype = "document";
        } else {
          dbMessage.mensagemtype = "file";
        }
        
        console.log(`[CHANNEL_MESSAGE_PERSISTENCE] External media URL detected. Type: ${dbMessage.mensagemtype}`);
      } else {
        // Mensagem de texto simples
        dbMessage.mensagemtype = "text";
        console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Text message: ${dbMessage.message.substring(0, 50)}...`);
      }
    }

    console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Saving to ${tableName}:`, {
      session_id: dbMessage.session_id,
      message_length: dbMessage.message?.length || 0,
      mensagemtype: dbMessage.mensagemtype,
      tipo_remetente: dbMessage.tipo_remetente,
      read_at: dbMessage.read_at
    });

    const { error } = await (supabase as any)
      .from(tableName)
      .insert(dbMessage);

    if (error) {
      console.error(`[CHANNEL_MESSAGE_PERSISTENCE] Error saving message to ${tableName}:`, error);
      throw error;
    }

    console.log(`✅ [CHANNEL_MESSAGE_PERSISTENCE] Message saved successfully to ${tableName}`);
  }
}
