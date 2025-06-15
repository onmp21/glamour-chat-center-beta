
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChannelApiMapping {
  id?: string;
  channel_id: string;
  api_instance_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useChannelApiMappings() {
  const [mappings, setMappings] = useState<ChannelApiMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('channel_api_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMappings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading channel API mappings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  const upsertMapping = async (channelId: string, apiInstanceId: string) => {
    try {
      // First check if mapping exists
      const { data: existing } = await supabase
        .from('channel_api_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('channel_api_mappings')
          .update({ api_instance_id: apiInstanceId })
          .eq('channel_id', channelId)
          .select()
          .single();

        if (error) throw error;
        
        setMappings(prev => prev.map(m => m.channel_id === channelId ? data : m));
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('channel_api_mappings')
          .insert([{ channel_id: channelId, api_instance_id: apiInstanceId }])
          .select()
          .single();

        if (error) throw error;

        setMappings(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error upserting mapping:', err);
      throw err;
    }
  };

  const deleteMapping = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('channel_api_mappings')
        .delete()
        .eq('channel_id', channelId);

      if (error) throw error;

      setMappings(prev => prev.filter(m => m.channel_id !== channelId));
    } catch (err) {
      console.error('Error deleting mapping:', err);
      throw err;
    }
  };

  return {
    mappings,
    loading,
    error,
    loadMappings,
    upsertMapping,
    deleteMapping
  };
}
