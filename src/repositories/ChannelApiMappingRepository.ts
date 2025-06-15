
import { supabase } from '../integrations/supabase/client';

export interface ChannelInstanceMapping {
  id?: string;
  channel_id: string;
  instance_id: string;
  created_at?: string;
  updated_at?: string;
}

export class ChannelApiMappingRepository {
  async getAll(): Promise<ChannelInstanceMapping[]> {
    try {
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('id, channel_id, instance_id, created_at, updated_at')
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
        .select('id, channel_id, instance_id, created_at, updated_at')
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
          instance_id: mapping.instance_id,
        })
        .select('id, channel_id, instance_id, created_at, updated_at')
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
        })
        .eq('id', id)
        .select('id, channel_id, instance_id, created_at, updated_at')
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

  async upsertByChannelId(channelId: string, instanceId: string): Promise<ChannelInstanceMapping> {
    try {
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .upsert({
          channel_id: channelId,
          instance_id: instanceId,
        }, {
          onConflict: 'channel_id'
        })
        .select('id, channel_id, instance_id, created_at, updated_at')
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
