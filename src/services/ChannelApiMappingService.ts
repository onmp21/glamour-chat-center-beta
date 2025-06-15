import { supabase } from "../lib/supabase";
import { RawMessage } from '@/types/messageTypes';

type ChannelApiMapping = {
  id: string;
  channel_id: string;
  instance_id: string;
  channel_name?: string;
  instance_name?: string;
  base_url?: string;
  api_key?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export class ChannelApiMappingService {
  private static mappings: ChannelApiMapping[] | null = null;
  private static isFetching: boolean = false;
  private static fetchPromise: Promise<ChannelApiMapping[] | null> | null = null;
  private static legacyIdToUuidCache: Record<string, string> = {};

  constructor() {}

  static async fetchMappings(): Promise<ChannelApiMapping[] | null> {
    if (this.mappings !== null) {
      return this.mappings;
    }
    if (this.isFetching) {
      return this.fetchPromise || null;
    }
    this.isFetching = true;
    this.fetchPromise = new Promise(async (resolve) => {
      try {
        const { data, error } = await supabase
          .from('channel_instance_mappings')
          .select('*');
        if (error) {
          console.error("Error fetching channel instance mappings:", error);
          resolve(null);
        } else {
          this.mappings = data;
          resolve(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching channel instance mappings:", err);
        resolve(null);
      } finally {
        this.isFetching = false;
        this.fetchPromise = null;
      }
    });
    return this.fetchPromise;
  }

  static async getMappings(): Promise<ChannelApiMapping[] | null> {
    if (this.mappings === null) {
      await this.fetchMappings();
    }
    return this.mappings;
  }

  /**
   * Mapeamento robusto de legacyId → UUID, focado em garantir que
   * canais como 'chat', 'canarana', 'gerente-lojas', etc. sejam resolvidos para UUID.
   */
  static async getChannelUuid(legacyId: string): Promise<string | null> {
    // Permitir UUID direto (validação simples de UUID v4)
    if (/^[0-9a-fA-F-]{36}$/.test(legacyId)) {
      return legacyId;
    }
    // Usar cache para performance
    if (ChannelApiMappingService.legacyIdToUuidCache[legacyId]) {
      return ChannelApiMappingService.legacyIdToUuidCache[legacyId];
    }
    // Alias conhecidos (garante legacy compatibility)
    const aliasToName: Record<string, string> = {
      "chat": "Yelena-AI",
      "canarana": "Canarana",
      "souto-soares": "Souto Soares",
      "joao-dourado": "João Dourado",
      "america-dourada": "América Dourada",
      "gerente-lojas": "Gerente das Lojas",
      "gerente-externo": "Andressa Gerente Externo"
    };
    // Buscar canais do supabase (precisa garantir UUID correto!)
    try {
      const { data, error } = await supabase.from('channels').select('id, name');
      if (error) {
        console.warn("[ChannelApiMappingService] Falha ao buscar canais:", error.message);
        return null;
      }
      if (data) {
        // Preencher o cache
        data.forEach((ch: { id: string; name: string }) => {
          // Mapear tanto pelo legacy quanto pelo name/UUID
          Object.entries(aliasToName).forEach(([legacy, canonical]) => {
            if (ch.name === canonical) {
              ChannelApiMappingService.legacyIdToUuidCache[legacy] = ch.id;
              ChannelApiMappingService.legacyIdToUuidCache[ch.name] = ch.id;
            }
          });
          // Garantir pelo próprio name
          ChannelApiMappingService.legacyIdToUuidCache[ch.name] = ch.id;
          ChannelApiMappingService.legacyIdToUuidCache[ch.id] = ch.id;
        });
        // Resultado final
        const uuid = ChannelApiMappingService.legacyIdToUuidCache[legacyId] || null;
        console.log(`[ChannelApiMappingService:getChannelUuid] legacyId='${legacyId}' ⇒ uuid='${uuid}'`);
        return uuid;
      }
    } catch (e) {
      console.error("[ChannelApiMappingService] Erro inesperado:", e);
    }
    return null;
  }

  static async getApiInstanceForChannel(channelId: string) {
    const mappings = await this.getMappings();
    if (!mappings) {
      console.warn("Channel mappings not yet loaded.");
      return null;
    }

    const mapping = mappings.find(m => m.channel_id === channelId);
    if (!mapping) {
      return null;
    }

    // The mapping contains all required data for API instance
    return {
      base_url: mapping.base_url,
      api_key: mapping.api_key,
      instance_name: mapping.instance_name,
      id: mapping.instance_id,
    };
  }

  static async sendMessageViaEvolution(
    channelId: string,
    conversationId: string,
    content: string,
    mediaUrl?: string
  ): Promise<boolean> {
    try {
      const apiInstance = await this.getApiInstanceForChannel(channelId);
      if (!apiInstance) {
        console.error("No API instance found for channel:", channelId);
        return false;
      }

      const payload = {
        number: conversationId,
        text: content,
        ...(mediaUrl && { media: mediaUrl })
      };

      const response = await fetch(`${apiInstance.base_url}/message/sendText/${apiInstance.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiInstance.api_key
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending message via Evolution API:", error);
      return false;
    }
  }

  static async saveMessageToChannel(channelId: string, message: RawMessage): Promise<void> {
    // Atualizado: mapeamento com UUIDs e legacy, e campo nome_do_contato minúsculo
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

    const tableName = tableMapping[channelId] || tableMapping[await this.getChannelUuid(channelId) || ''] || 'yelena_ai_conversas';

    if (!tableName) {
      console.error(`[saveMessageToChannel] No table mapping found for channel: ${channelId}`);
      throw new Error('Canal não encontrado para salvar mensagens');
    }

    // Garantir nome_do_contato e campo correto
    const dbMessage = {
      session_id: message.session_id,
      message: message.message,
      read_at: message.read_at,
      nome_do_contato: message.nome_do_contato || message.Nome_do_contato || "Atendente",
      mensagemtype: message.mensagemtype || 'text',
      tipo_remetente: message.tipo_remetente,
      media_base64: message.media_base64
    };

    // Debug log
    console.log(`[saveMessageToChannel] Salvando mensagem em '${tableName}':`, dbMessage);

    // Inserção robusta: verifica sucesso antes de confirmar
    const { error } = await (supabase as any)
      .from(tableName)
      .insert(dbMessage);

    if (error) {
      console.error(`[saveMessageToChannel] Error saving message to ${tableName}:`, error);
      throw error;
    }
  }

  static clearCache(): void {
    this.mappings = null;
  }
}
