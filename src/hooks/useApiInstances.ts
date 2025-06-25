
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApiInstance } from '@/types/domain/api/ApiInstance';

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

      // Ensure the data conforms to ApiInstance type
      const formattedInstances: ApiInstance[] = (data || []).map(instance => ({
        ...instance,
        id: instance.id,
        created_at: instance.created_at,
      }));

      setInstances(formattedInstances);
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

      await loadInstances();
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
