
import { supabase } from "../lib/supabase";
import { RawMessage } from '@/types/messageTypes';
import { ChannelUuidResolver } from './ChannelUuidResolver';

export class ChannelMessagePersistence {
  static async saveMessageToChannel(channelId: string, message: RawMessage): Promise<void> {
    const tableMapping: Record<string, string> = {
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
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
      console.error(`[saveMessageToChannel] No table mapping found for channel: ${channelId}`);
      throw new Error('Canal não encontrado para salvar mensagens');
    }

    const dbMessage: any = {
      session_id: message.session_id,
      message: message.message,
      read_at: message.read_at,
      nome_do_contato: message.nome_do_contato || message.Nome_do_contato || "Atendente",
      mensagemtype: message.mensagemtype || "text",
      tipo_remetente: message.tipo_remetente,
      media_url: message.media_url || null
    };

    // Se não houver mensagem (caption), usar placeholder padrão
    if ((!dbMessage.message || dbMessage.message.trim() === "") && dbMessage.media_url) {
      if (dbMessage.mensagemtype === "image") dbMessage.message = "[Imagem]";
      else if (dbMessage.mensagemtype === "audio") dbMessage.message = "[Áudio]";
      else if (dbMessage.mensagemtype === "video") dbMessage.message = "[Vídeo]";
      else if (dbMessage.mensagemtype === "document" || dbMessage.mensagemtype === "file") dbMessage.message = "[Documento]";
      else dbMessage.message = "[Mídia]";
    }

    console.log(`[saveMessageToChannel] Salvando mensagem:`, dbMessage);

    const { error } = await (supabase as any)
      .from(tableName)
      .insert(dbMessage);

    if (error) {
      console.error(`[saveMessageToChannel] Error saving message to ${tableName}:`, error);
      throw error;
    }
  }
}
