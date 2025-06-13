
import { Database } from "@/types/supabase";
import { supabase } from "../lib/supabase";

type ChannelApiMapping = Database['public']['Tables']['channel_api_mappings']['Row'];

export class ChannelApiMappingService {
  private static mappings: ChannelApiMapping[] | null = null;
  private static isFetching: boolean = false;
  private static fetchPromise: Promise<ChannelApiMapping[] | null> | null = null;

  // Make constructor public to fix access errors
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

  // Make getChannelUuid public and fix implementation
  static async getChannelUuid(channelId: string): Promise<string | null> {
    const mappings = await this.getMappings();
    if (!mappings) {
      console.warn("Channel mappings not yet loaded.");
      return null;
    }

    return mappings.find(mapping => mapping.channel_id === channelId)?.api_instance_uuid || null;
  }

  static clearCache(): void {
    this.mappings = null;
  }
}
