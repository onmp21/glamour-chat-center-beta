
import { Database } from "@/types/supabase";
import { supabase } from "../lib/supabase";

type ChannelApiMapping = Database['public']['Tables']['channel_api_mappings']['Row'];

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

  static async getChannelUuid(channelId: string): Promise<string | null> {
    const mappings = await this.getMappings();
    if (!mappings) {
      console.warn("Channel mappings not yet loaded.");
      return null;
    }

    return mappings.find(mapping => mapping.channel_id === channelId)?.api_instance_uuid || null;
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

  static clearCache(): void {
    this.mappings = null;
  }
}
