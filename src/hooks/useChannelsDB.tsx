
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Channel {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useChannelsDB() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setChannels(data || []);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError('Falha ao carregar canais');
    } finally {
      setLoading(false);
    }
  }, []);

  const createChannel = useCallback(async (channelData: Omit<Channel, 'id' | 'created_at' | 'updated_at'>): Promise<Channel | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('channels')
        .insert(channelData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchChannels(); // Refresh channels after creation
      return data;
    } catch (err) {
      console.error('Error creating channel:', err);
      setError('Falha ao criar canal');
      return null;
    }
  }, [fetchChannels]);

  const updateChannel = useCallback(async (id: string, channelData: Partial<Channel>): Promise<Channel | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('channels')
        .update(channelData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchChannels(); // Refresh channels after update
      return data;
    } catch (err) {
      console.error(`Error updating channel ${id}:`, err);
      setError('Falha ao atualizar canal');
      return null;
    }
  }, [fetchChannels]);

  const deleteChannel = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      await fetchChannels(); // Refresh channels after deletion
    } catch (err) {
      console.error(`Error deleting channel ${id}:`, err);
      setError('Falha ao excluir canal');
    }
  }, [fetchChannels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    loading,
    error,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel
  };
}
