import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChannelInstanceMapping {
  id?: string;
  channel_id: string;
  instance_id: string;
  channel_name: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
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

  /**
   * When upserting, fetch all required data columns beforehand.
   */
  const upsertMapping = async (channelId: string, instanceId: string) => {
    try {
      // Get channel object with name
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('id, name')
        .eq('id', channelId)
        .maybeSingle();

      if (channelError || !channelData) throw channelError || new Error("Canal não encontrado");

      // Get instance object with all required fields
      const { data: instanceData, error: instanceError } = await supabase
        .from('api_instances')
        .select('id, instance_name, base_url, api_key')
        .eq('id', instanceId)
        .maybeSingle();

      if (instanceError || !instanceData) throw instanceError || new Error("Instância não encontrada");

      // First check if mapping exists
      const { data: existing } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      const mappingPayload = {
        channel_id: channelId,
        channel_name: channelData.name,
        instance_id: instanceId,
        instance_name: instanceData.instance_name,
        base_url: instanceData.base_url,
        api_key: instanceData.api_key,
        is_active: true,
      };

      let data, error;
      if (existing) {
        // Update existing (all columns for simplicity)
        ({ data, error } = await supabase
          .from('channel_instance_mappings')
          .update(mappingPayload)
          .eq('channel_id', channelId)
          .select()
          .maybeSingle());
        if (error) throw error;
        setMappings(prev => prev.map(m => m.channel_id === channelId ? { ...m, ...data } : m));
      } else {
        // Insert full mapping row
        ({ data, error } = await supabase
          .from('channel_instance_mappings')
          .insert([mappingPayload])
          .select()
          .maybeSingle());
        if (error) throw error;
        setMappings(prev => [data, ...prev]);
      }

      // Configurar webhook N8N automaticamente após criar/atualizar mapping
      try {
        console.log(`🔗 [CHANNEL_MAPPING] Configurando webhook N8N para canal: ${channelId}`);
        
        const { EvolutionApiService } = await import('@/services/EvolutionApiService');
        const apiService = new EvolutionApiService({
          baseUrl: instanceData.base_url,
          apiKey: instanceData.api_key,
          instanceName: instanceData.instance_name
        });

        const webhookResult = await apiService.setWebhookForChannel(channelData.name);
        
        if (webhookResult.success) {
          console.log(`✅ [CHANNEL_MAPPING] Webhook N8N configurado com sucesso para canal: ${channelId}`);
        } else {
          console.error(`❌ [CHANNEL_MAPPING] Erro ao configurar webhook N8N:`, webhookResult.error);
        }
      } catch (webhookError) {
        console.error('❌ [CHANNEL_MAPPING] Erro ao configurar webhook N8N:', webhookError);
      }

      return data;
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
