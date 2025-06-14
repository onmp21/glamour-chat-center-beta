import { supabase } from '@/integrations/supabase/client.ts';

export interface ChannelInstanceMapping {
  id: string;
  channel_id: string;
  channel_name: string;
  instance_id: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvolutionInstanceConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface AvailableChannel {
  id: string;
  name: string;
}

export class ChannelInstanceMappingService {
  /**
   * Obter lista de canais disponíveis para vinculação
   */
  getAvailableChannels(): AvailableChannel[] {
    return [
      { id: 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6', name: 'Chat' },
      { id: '011b69ba-cf25-4f63-af2e-4ad0260d9516', name: 'Canarana' },
      { id: 'b7996f75-41a7-4725-8229-564f31868027', name: 'Souto Soares' },
      { id: '621abb21-60b2-4ff2-a0a6-172a94b4b65c', name: 'João Dourado' },
      { id: '64d8acad-c645-4544-a1e6-2f0825fae00b', name: 'America Dourada' },
      { id: 'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce', name: 'Gerente Lojas' },
      { id: 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7', name: 'Gerente Externo' }
    ];
  }

  /**
   * Obter configuração da Evolution API para um canal específico
   */
  async getEvolutionInstanceForChannel(channelId: string): Promise<EvolutionInstanceConfig | null> {
    try {
      console.log(`🔍 [CHANNEL_MAPPING] Buscando instância para canal: ${channelId}`);
      
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ [CHANNEL_MAPPING] Nenhuma vinculação encontrada para canal: ${channelId}`);
          return null;
        }
        console.error('❌ [CHANNEL_MAPPING] Erro ao buscar vinculação:', error);
        throw new Error(`Erro ao buscar vinculação: ${error.message}`);
      }

      console.log(`✅ [CHANNEL_MAPPING] Instância encontrada: ${data.instance_name}`);
      return {
        baseUrl: data.base_url,
        apiKey: data.api_key,
        instanceName: data.instance_name
      };
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      return null;
    }
  }

  /**
   * Obter todas as vinculações de canal-instância
   */
  async getAllMappings(): Promise<ChannelInstanceMapping[]> {
    try {
      console.log('🔍 [CHANNEL_MAPPING] Buscando todas as vinculações...');
      
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [CHANNEL_MAPPING] Erro ao buscar vinculações:', error);
        throw new Error(`Erro ao buscar vinculações: ${error.message}`);
      }

      console.log(`✅ [CHANNEL_MAPPING] ${data?.length || 0} vinculações encontradas`);
      return data || [];
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      throw error;
    }
  }

  /**
   * Obter vinculação por canal
   */
  async getMappingByChannel(channelId: string): Promise<ChannelInstanceMapping | null> {
    try {
      console.log(`🔍 [CHANNEL_MAPPING] Buscando vinculação para canal: ${channelId}`);
      
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ [CHANNEL_MAPPING] Nenhuma vinculação ativa encontrada para canal: ${channelId}`);
          return null;
        }
        console.error('❌ [CHANNEL_MAPPING] Erro ao buscar vinculação:', error);
        throw new Error(`Erro ao buscar vinculação: ${error.message}`);
      }

      console.log(`✅ [CHANNEL_MAPPING] Vinculação encontrada: ${data.instance_name}`);
      return data;
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      throw error;
    }
  }

  /**
   * Criar nova vinculação canal-instância
   */
  async createMapping(mapping: Omit<ChannelInstanceMapping, 'id' | 'created_at' | 'updated_at'>): Promise<ChannelInstanceMapping> {
    try {
      console.log(`🚀 [CHANNEL_MAPPING] Criando vinculação: ${mapping.channel_name} -> ${mapping.instance_name}`);
      
      // Desativar vinculações existentes para o canal
      await this.deactivateMappingsForChannel(mapping.channel_id);
      
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .insert([{
          channel_id: mapping.channel_id,
          channel_name: mapping.channel_name,
          instance_id: mapping.instance_id,
          instance_name: mapping.instance_name,
          base_url: mapping.base_url,
          api_key: mapping.api_key,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [CHANNEL_MAPPING] Erro ao criar vinculação:', error);
        throw new Error(`Erro ao criar vinculação: ${error.message}`);
      }

      console.log(`✅ [CHANNEL_MAPPING] Vinculação criada com sucesso: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      throw error;
    }
  }

  /**
   * Atualizar vinculação existente
   */
  async updateMapping(id: string, updates: Partial<ChannelInstanceMapping>): Promise<ChannelInstanceMapping> {
    try {
      console.log(`🔄 [CHANNEL_MAPPING] Atualizando vinculação: ${id}`);
      
      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [CHANNEL_MAPPING] Erro ao atualizar vinculação:', error);
        throw new Error(`Erro ao atualizar vinculação: ${error.message}`);
      }

      console.log('✅ [CHANNEL_MAPPING] Vinculação atualizada com sucesso');
      return data;
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      throw error;
    }
  }

  /**
   * Deletar vinculação
   */
  async deleteMapping(id: string): Promise<void> {
    try {
      console.log(`🗑️ [CHANNEL_MAPPING] Deletando vinculação: ${id}`);
      
      const { error } = await supabase
        .from('channel_instance_mappings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [CHANNEL_MAPPING] Erro ao deletar vinculação:', error);
        throw new Error(`Erro ao deletar vinculação: ${error.message}`);
      }

      console.log('✅ [CHANNEL_MAPPING] Vinculação deletada com sucesso');
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      throw error;
    }
  }

  /**
   * Desativar todas as vinculações para um canal
   */
  private async deactivateMappingsForChannel(channelId: string): Promise<void> {
    try {
      console.log(`🔄 [CHANNEL_MAPPING] Desativando vinculações existentes para canal: ${channelId}`);
      
      const { error } = await supabase
        .from('channel_instance_mappings')
        .update({ is_active: false })
        .eq('channel_id', channelId);

      if (error) {
        console.error('❌ [CHANNEL_MAPPING] Erro ao desativar vinculações:', error);
        throw new Error(`Erro ao desativar vinculações: ${error.message}`);
      }

      console.log('✅ [CHANNEL_MAPPING] Vinculações desativadas');
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro geral:', error);
      throw error;
    }
  }

  /**
   * Verificar se uma instância já existe na API Evolution
   */
  async checkIfInstanceExists(baseUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    try {
      console.log(`🔍 [CHANNEL_MAPPING] Verificando se instância existe: ${instanceName}`);
      
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey
        }
      });

      if (!response.ok) {
        console.error(`❌ [CHANNEL_MAPPING] Erro ao verificar instâncias: ${response.status}`);
        return false;
      }

      const instances = await response.json();
      const exists = instances.some((instance: any) => 
        instance.instance.instanceName === instanceName
      );
      
      console.log(`📋 [CHANNEL_MAPPING] Instância ${instanceName} ${exists ? 'existe' : 'não existe'}`);
      return exists;
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro ao verificar instância:', error);
      return false;
    }
  }

  /**
   * Importar instância existente para um canal
   */
  async importExistingInstance(
    channelId: string,
    channelName: string,
    instanceName: string,
    baseUrl: string,
    apiKey: string
  ): Promise<ChannelInstanceMapping> {
    try {
      console.log(`📥 [CHANNEL_MAPPING] Importando instância existente: ${instanceName} para canal ${channelName}`);
      
      // Verificar se a instância realmente existe
      const exists = await this.checkIfInstanceExists(baseUrl, apiKey, instanceName);
      if (!exists) {
        throw new Error(`Instância '${instanceName}' não encontrada na API Evolution`);
      }
      
      // Criar vinculação
      const mapping = await this.createMapping({
        channel_id: channelId,
        channel_name: channelName,
        instance_id: instanceName, // Usar o nome como ID também
        instance_name: instanceName,
        base_url: baseUrl,
        api_key: apiKey,
        is_active: true
      });

      console.log(`✅ [CHANNEL_MAPPING] Instância existente importada com sucesso`);
      return mapping;
    } catch (error) {
      console.error('❌ [CHANNEL_MAPPING] Erro ao importar instância:', error);
      throw error;
    }
  }
}
