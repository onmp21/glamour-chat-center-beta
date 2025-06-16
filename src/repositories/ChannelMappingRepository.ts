
import { supabase } from "../lib/supabase";

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

export class ChannelMappingRepository {
  private static mappings: ChannelApiMapping[] | null = null;
  private static isFetching: boolean = false;
  private static fetchPromise: Promise<ChannelApiMapping[] | null> | null = null;

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

    return {
      base_url: mapping.base_url,
      api_key: mapping.api_key,
      instance_name: mapping.instance_name,
      id: mapping.instance_id,
    };
  }

  static clearCache(): void {
    this.mappings = null;
  }
}
