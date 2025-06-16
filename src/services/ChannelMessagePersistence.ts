
import { supabase } from "../lib/supabase";
import { RawMessage } from '@/types/messageTypes';
import { ChannelUuidResolver } from './ChannelUuidResolver';

export class ChannelMessagePersistence {
  static async saveMessageToChannel(channelId: string, message: RawMessage): Promise<void> {
    const tableMapping: Record<string, string> = {
      // UUIDs padrão dos canais (ajuste para seus UUIDs se necessário)
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
      // Nomes legados e nomes "amigáveis"
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

    // Construir a mensagem para o banco
    const dbMessage: any = {
      session_id: message.session_id,
      message: message.message, // SEPARADO do media_base64
      read_at: message.read_at,
      nome_do_contato: message.nome_do_contato || message.Nome_do_contato || "Atendente",
      mensagemtype: (
        message.mensagemtype === "conversation" && message.media_base64
          ? "file"
          : message.mensagemtype || "text"
      ),
      tipo_remetente: message.tipo_remetente,
    };

    // NOVO: processar sempre o base64 corretamente
    if (message.media_base64 && typeof message.media_base64 === "string" && message.media_base64.trim() !== "") {
      let base64 = message.media_base64.trim();
      // Garantir prefixo data:
      if (!base64.startsWith("data:")) {
        // Inferir o mimeType
        let type = (dbMessage.mensagemtype || "").toLowerCase();
        let mime = "application/octet-stream";
        if (type === "image") mime = "image/jpeg";
        else if (type === "audio") mime = "audio/mpeg";
        else if (type === "video") mime = "video/mp4";
        else if (type === "document" || type === "file") mime = "application/pdf";
        base64 = `data:${mime};base64,${base64}`;
      }
      dbMessage.media_base64 = base64;
      // Se não houver mensagem (caption), usa placeholder padrão
      if ((!dbMessage.message || dbMessage.message.trim() === "")
        && ["image", "audio", "video", "document", "file"].includes(dbMessage.mensagemtype)) {
        if (dbMessage.mensagemtype === "image") dbMessage.message = "[Imagem]";
        else if (dbMessage.mensagemtype === "audio") dbMessage.message = "[Áudio]";
        else if (dbMessage.mensagemtype === "video") dbMessage.message = "[Vídeo]";
        else if (dbMessage.mensagemtype === "document" || dbMessage.mensagemtype === "file") dbMessage.message = "[Documento]";
        else dbMessage.message = "[Mídia]";
      }
      console.log(`[saveMessageToChannel:REFORMULADO] media_base64 está presente. Tipo: ${dbMessage.mensagemtype}. Tamanho: ${(base64 || '').length}. Caption: ${dbMessage.message}`);
    } else {
      dbMessage.media_base64 = null;
    }

    console.log(`[saveMessageToChannel:REFORMULADO] Salvando mensagem:`, dbMessage);

    const { error } = await (supabase as any)
      .from(tableName)
      .insert(dbMessage);

    if (error) {
      console.error(`[saveMessageToChannel] Error saving message to ${tableName}:`, error);
      throw error;
    }
  }
}
