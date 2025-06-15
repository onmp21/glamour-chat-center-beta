import { supabase } from "../lib/supabase";
import { RawMessage } from '@/types/messageTypes';

type ChannelApiMapping = {
  id: string;
  channel_id: string;
  api_instance_id: string;
  created_at?: string;
  updated_at?: string;
  api_instance_uuid?: string;
};

export class ChannelApiMappingService {
  private static mappings: ChannelApiMapping[] | null = null;
  private static isFetching: boolean = false;
  private static fetchPromise: Promise<ChannelApiMapping[] | null> | null = null;

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
          .from('channel_api_mappings')
          .select('*');

        if (error) {
          console.error("Error fetching channel API mappings:", error);
          resolve(null);
        } else {
          this.mappings = data;
          resolve(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching channel API mappings:", err);
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
      return await this.fetchMappings();
    }
    return this.mappings;
  }

  /**
   * Novo método para obter o UUID real do canal a partir de seu legacyId.
   * Busca no Supabase caso ainda não esteja em cache.
   */
  static async getChannelUuid(legacyId: string): Promise<string | null> {
    // Tenta buscar todos os mapeamentos do Supabase só uma vez
    if (!this.mappings) {
      await this.fetchMappings();
    }
    const allChannels = this.mappings;

    // Buscar na coluna legacyId, se existir
    // Prioriza busca exata pelo canal (caso a tabela 'channels' contenha este campo futuro)
    // Aqui mantemos compatibilidade buscando por legacyId conhecido e depois pelo próprio UUID
    const legacyToUuid: Record<string, string> = {};
    // Monta um dicionário legacyId → UUID
    if (allChannels) {
      for (const mapping of allChannels) {
        legacyToUuid[mapping.channel_id] = mapping.channel_id; // assume UUID coincidente
      }
    }
    // Se está usando um UUID, devolve como está
    if (/^[0-9a-fA-F-]{36}$/.test(legacyId)) {
      return legacyId;
    }

    // Adicionar aliases conhecidos usados na aplicação:
    const aliasToName: Record<string, string> = {
      "chat": "Yelena-AI",
      "canarana": "Canarana",
      "souto-soares": "Souto Soares",
      "joao-dourado": "João Dourado",
      "america-dourada": "América Dourada",
      "gerente-lojas": "Gerente das Lojas",
      "gerente-externo": "Andressa Gerente Externo",
    };

    const channelsTable = await supabase.from('channels').select('id, name');
    if (channelsTable.error) {
      console.warn("[ChannelApiMappingService] Falha ao buscar canais:", channelsTable.error.message);
    } else if (channelsTable.data) {
      for (const ch of channelsTable.data) {
        // Mapeia tanto pelo nome quanto pelos aliases
        legacyToUuid[aliasToName[ch.name] || ch.name] = ch.id;
        legacyToUuid[ch.id] = ch.id;
        legacyToUuid[ch.name] = ch.id;
      }
    }

    return legacyToUuid[legacyId] || null;
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

    // Get API instance details
    const { data: apiInstance, error } = await supabase
      .from('api_instances')
      .select('*')
      .eq('id', mapping.api_instance_id)
      .single();

    if (error || !apiInstance) {
      console.error("Error fetching API instance:", error);
      return null;
    }

    return apiInstance;
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
    // Get table name for channel
    const tableMapping: Record<string, string> = {
      'yelena': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };

    const tableName = tableMapping[channelId];
    if (!tableName) {
      console.error(`No table mapping found for channel: ${channelId}`);
      return;
    }

    // Convert RawMessage to database format
    const dbMessage = {
      session_id: message.session_id,
      message: message.message,
      read_at: message.read_at,
      Nome_do_contato: message.Nome_do_contato,
      mensagemtype: message.mensagemtype || 'text',
      tipo_remetente: message.tipo_remetente,
      media_base64: message.media_base64
    };

    // Use dynamic query with type assertion
    const { error } = await (supabase as any)
      .from(tableName)
      .insert(dbMessage);

    if (error) {
      console.error(`Error saving message to ${tableName}:`, error);
      throw error;
    }
  }

  static clearCache(): void {
    this.mappings = null;
  }
}
