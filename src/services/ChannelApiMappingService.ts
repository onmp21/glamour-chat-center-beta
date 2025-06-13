import { Database } from "@/types/supabase";
import { supabase } from "../lib/supabase";

type ChannelApiMapping = Database['public']['Tables']['channel_api_mappings']['Row'];

export class ChannelApiMappingService {
  private static mappings: ChannelApiMapping[] | null = null;
  private static isFetching: boolean = false;
  private static fetchPromise: Promise<ChannelApiMapping[] | null> | null = null;

  private constructor() {}

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

  static getChannelUuid(channelId: string): string | null {
    if (!this.mappings) {
      console.warn("Channel mappings not yet loaded. Attempting to fetch.");
      this.fetchMappings().then(() => {
        if (this.mappings) {
          return this.mappings.find(mapping => mapping.channel_id === channelId)?.api_instance_uuid || null;
        } else {
          console.error("Failed to load channel mappings.");
          return null;
        }
      });
      return null;
    }

    return this.mappings.find(mapping => mapping.channel_id === channelId)?.api_instance_uuid || null;
  }

  // Make getChannelUuid public to fix access error
  public static getChannelUuid(channelId: string): string | null {
    return this.getChannelUuid(channelId);
  }

  static clearCache(): void {
    this.mappings = null;
  }
}
