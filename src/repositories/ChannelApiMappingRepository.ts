
import { supabase } from '../integrations/supabase/client';
import { ChannelApiMapping } from '../types/domain/api/ChannelApiMapping';

export class ChannelApiMappingRepository {
  async getAll(): Promise<ChannelApiMapping[]> {
    try {
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .select('*')
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

  async getByChannelId(channelId: string): Promise<ChannelApiMapping | null> {
    try {
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
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

  async create(mapping: ChannelApiMapping): Promise<ChannelApiMapping> {
    try {
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .insert({
          channel_id: mapping.channel_id,
          api_instance_id: mapping.api_instance_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar mapeamento:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar mapeamento:', error);
      throw error;
    }
  }

  async update(id: string, mapping: Partial<ChannelApiMapping>): Promise<ChannelApiMapping> {
    try {
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .update({
          api_instance_id: mapping.api_instance_id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao atualizar mapeamento ${id}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Erro ao atualizar mapeamento ${id}:`, error);
      throw error;
    }
  }

  async upsertByChannelId(channelId: string, apiInstanceId: string): Promise<ChannelApiMapping> {
    try {
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .upsert({
          channel_id: channelId,
          api_instance_id: apiInstanceId
        }, {
          onConflict: 'channel_id'
        })
        .select()
        .single();

      if (error) {
        console.error(`Erro ao upsert mapeamento para canal ${channelId}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Erro ao upsert mapeamento para canal ${channelId}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('channel_api_mappings')
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
        .from('channel_api_mappings')
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
