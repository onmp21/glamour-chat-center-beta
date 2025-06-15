
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChannelInstanceMapping {
  id?: string;
  channel_id: string;
  instance_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useChannelApiMappings() {
  const [mappings, setMappings] = useState<ChannelInstanceMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMappings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading channel instance mappings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load instance mappings');
    } finally {
      setLoading(false);
    }
  };

  const upsertMapping = async (channelId: string, instanceId: string) => {
    try {
      // First check if mapping exists
      const { data: existing } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('channel_instance_mappings')
          .update({ instance_id: instanceId })
          .eq('channel_id', channelId)
          .select()
          .single();

        if (error) throw error;
        
        setMappings(prev => prev.map(m => m.channel_id === channelId ? data : m));
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('channel_instance_mappings')
          .insert([{ channel_id: channelId, instance_id: instanceId }])
          .select()
          .single();

        if (error) throw error;

        setMappings(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error upserting instance mapping:', err);
      throw err;
    }
  };

  const deleteMapping = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('channel_instance_mappings')
        .delete()
        .eq('channel_id', channelId);

      if (error) throw error;

      setMappings(prev => prev.filter(m => m.channel_id !== channelId));
    } catch (err) {
      console.error('Error deleting instance mapping:', err);
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
