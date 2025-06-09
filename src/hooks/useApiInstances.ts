
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApiInstance {
  id?: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at?: string;
  updated_at?: string;
}

export function useApiInstances() {
  const [instances, setInstances] = useState<ApiInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInstances(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading API instances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load instances');
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (instance: Omit<ApiInstance, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('api_instances')
        .insert([instance])
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating instance:', err);
      throw err;
    }
  };

  const updateInstance = async (id: string, updates: Partial<ApiInstance>) => {
    try {
      const { data, error } = await supabase
        .from('api_instances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => prev.map(inst => inst.id === id ? data : inst));
      return data;
    } catch (err) {
      console.error('Error updating instance:', err);
      throw err;
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstances(prev => prev.filter(inst => inst.id !== id));
    } catch (err) {
      console.error('Error deleting instance:', err);
      throw err;
    }
  };

  return {
    instances,
    loading,
    error,
    loadInstances,
    createInstance,
    updateInstance,
    deleteInstance
  };
}
