
import { supabase } from '../integrations/supabase/client';

export interface ChannelInstanceMapping {
  id?: string;
  channel_id: string;
  instance_id: string;
  channel_name?: string;
  instance_name?: string;
  base_url?: string;
  api_key?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export class ChannelApiMappingRepository {
  async getAll(): Promise<ChannelInstanceMapping[]> {
    try {
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('id, channel_id, instance_id, channel_name, instance_name, base_url, api_key, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar mapeamentos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mapeamentos:', error);
      return [];
    }
  }

  async getByChannelId(channelId: string): Promise<ChannelInstanceMapping | null> {
    try {
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('id, channel_id, instance_id, channel_name, instance_name, base_url, api_key, is_active, created_at, updated_at')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (error) {
        if ((error as any)?.code === 'PGRST116') {
          return null; // Nenhum registro encontrado
        }
        console.error(`Erro ao buscar mapeamento para canal ${channelId}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Erro ao buscar mapeamento para canal ${channelId}:`, error);
      return null;
    }
  }

  async create(mapping: ChannelInstanceMapping): Promise<ChannelInstanceMapping> {
    try {
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .insert({
          channel_id: mapping.channel_id,
          channel_name: mapping.channel_name,
          instance_id: mapping.instance_id,
          instance_name: mapping.instance_name,
          base_url: mapping.base_url,
          api_key: mapping.api_key,
          is_active: mapping.is_active ?? true
        })
        .select('id, channel_id, instance_id, channel_name, instance_name, base_url, api_key, is_active, created_at, updated_at')
        .maybeSingle();

      if (error) {
        console.error('Erro ao criar mapeamento:', error);
        throw error;
      }

      return data!;
    } catch (error) {
      console.error('Erro ao criar mapeamento:', error);
      throw error;
    }
  }

  async update(id: string, mapping: Partial<ChannelInstanceMapping>): Promise<ChannelInstanceMapping> {
    try {
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .update({
          ...(mapping.instance_id && { instance_id: mapping.instance_id }),
          ...(mapping.channel_name && { channel_name: mapping.channel_name }),
          ...(mapping.instance_name && { instance_name: mapping.instance_name }),
          ...(mapping.base_url && { base_url: mapping.base_url }),
          ...(mapping.api_key && { api_key: mapping.api_key }),
          ...(typeof mapping.is_active !== 'undefined' && { is_active: mapping.is_active }),
        })
        .eq('id', id)
        .select('id, channel_id, instance_id, channel_name, instance_name, base_url, api_key, is_active, created_at, updated_at')
        .maybeSingle();

      if (error) {
        console.error(`Erro ao atualizar mapeamento ${id}:`, error);
        throw error;
      }

      return data!;
    } catch (error) {
      console.error(`Erro ao atualizar mapeamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upsert mapping by channel ID, requires all required fields.
   * This method requires fetching channel and instance details prior to upsert.
   */
  async upsertByChannelId(channelId: string, instanceId: string): Promise<ChannelInstanceMapping> {
    try {
      // Fetch channel details
      const { data: channel } = await supabase
        .from('channels')
        .select('id, name')
        .eq('id', channelId)
        .maybeSingle();
      if (!channel) throw new Error('Canal não encontrado');

      // Fetch instance details
      const { data: instance } = await supabase
        .from('api_instances')
        .select('id, instance_name, base_url, api_key')
        .eq('id', instanceId)
        .maybeSingle();
      if (!instance) throw new Error('Instância não encontrada');

      // Upsert the full row
      const { data, error } = await supabase.from('channel_instance_mappings')
        .upsert({
          channel_id: channel.id,
          channel_name: channel.name,
          instance_id: instance.id,
          instance_name: instance.instance_name,
          base_url: instance.base_url,
          api_key: instance.api_key,
          is_active: true,
        }, { onConflict: 'channel_id' })
        .select('id, channel_id, instance_id, channel_name, instance_name, base_url, api_key, is_active, created_at, updated_at')
        .maybeSingle();

      if (error) {
        console.error(`Erro ao upsert mapeamento para canal ${channelId}:`, error);
        throw error;
      }

      return data!;
    } catch (error) {
      console.error(`Erro ao upsert mapeamento para canal ${channelId}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('channel_instance_mappings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Erro ao excluir mapeamento ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Erro ao excluir mapeamento ${id}:`, error);
      throw error;
    }
  }

  async deleteByChannelId(channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('channel_instance_mappings')
        .delete()
        .eq('channel_id', channelId);

      if (error) {
        console.error(`Erro ao excluir mapeamento para canal ${channelId}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Erro ao excluir mapeamento para canal ${channelId}:`, error);
      throw error;
    }
  }
}
