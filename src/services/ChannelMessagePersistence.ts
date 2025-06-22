
import { supabase } from "../lib/supabase";
import { RawMessage } from '@/types/messageTypes';
import { ChannelUuidResolver } from './ChannelUuidResolver';

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

    // Construir a mensagem para o banco - APENAS Storage URLs
    const dbMessage: any = {
      session_id: message.session_id,
      message: message.message,
      read_at: message.read_at,
      nome_do_contato: message.nome_do_contato || message.Nome_do_contato || "Atendente",
      mensagemtype: message.mensagemtype || "text",
      tipo_remetente: message.tipo_remetente,
    };

    // NOVA LÓGICA SIMPLIFICADA: Apenas Storage URLs
    if (message.media_url && typeof message.media_url === "string" && message.media_url.trim() !== "") {
      // Verificar se é URL válida (HTTP ou Storage)
      const url = message.media_url.trim();
      if (url.startsWith('http') || url.includes('supabase.co/storage')) {
        dbMessage.media_url = url;
        
        // Definir tipo de mensagem baseado na URL se não especificado
        if (dbMessage.mensagemtype === "text" || !dbMessage.mensagemtype) {
          const lowerUrl = url.toLowerCase();
          if (lowerUrl.includes('image') || lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/)) {
            dbMessage.mensagemtype = "image";
          } else if (lowerUrl.includes('audio') || lowerUrl.match(/\.(mp3|ogg|wav|m4a)($|\?)/)) {
            dbMessage.mensagemtype = "audio";
          } else if (lowerUrl.includes('video') || lowerUrl.match(/\.(mp4|avi|mov|wmv)($|\?)/)) {
            dbMessage.mensagemtype = "video";
          } else if (lowerUrl.includes('document') || lowerUrl.match(/\.(pdf|doc|docx|txt)($|\?)/)) {
            dbMessage.mensagemtype = "document";
          } else {
            dbMessage.mensagemtype = "file";
          }
        }

        // Placeholder para mensagem se não houver caption
        if (!dbMessage.message || dbMessage.message.trim() === "") {
          switch (dbMessage.mensagemtype) {
            case "image": dbMessage.message = "[Imagem]"; break;
            case "audio": dbMessage.message = "[Áudio]"; break;
            case "video": dbMessage.message = "[Vídeo]"; break;
            case "document": dbMessage.message = "[Documento]"; break;
            default: dbMessage.message = "[Mídia]";
          }
        }

        console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Using media_url: ${url}. Type: ${dbMessage.mensagemtype}`);
      } else {
        console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Invalid media URL rejected: ${url}`);
        dbMessage.media_url = null;
      }
    } else {
      // Mensagem apenas de texto
      dbMessage.media_url = null;
      console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Text-only message: ${dbMessage.message}`);
    }

    // Remover suporte para media_base64 (sistema antigo)
    dbMessage.media_base64 = null;

    console.log(`[CHANNEL_MESSAGE_PERSISTENCE] Saving to ${tableName}:`, {
      session_id: dbMessage.session_id,
      message: dbMessage.message,
      mensagemtype: dbMessage.mensagemtype,
      has_media_url: !!dbMessage.media_url
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
