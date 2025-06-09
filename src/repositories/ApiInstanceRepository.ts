import { supabase } from '../integrations/supabase/client';
import { ApiInstance } from '../types/domain/api/ApiInstance';

export class ApiInstanceRepository {
  async getAll(): Promise<ApiInstance[]> {
    try {
      console.log('🔍 [API_INSTANCE_REPO] Buscando todas as instâncias da API...');
      const { data, error } = await supabase
        .from('api_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [API_INSTANCE_REPO] Erro Supabase ao buscar instâncias:', error);
        throw new Error(`Erro ao buscar instâncias: ${error.message}`);
      }

      console.log(`✅ [API_INSTANCE_REPO] ${data?.length || 0} instâncias encontradas`);
      return data || [];
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro geral ao buscar instâncias:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<ApiInstance | null> {
    try {
      console.log(`🔍 [API_INSTANCE_REPO] Buscando instância por ID: ${id}`);
      const { data, error } = await supabase
        .from('api_instances')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ [API_INSTANCE_REPO] Instância não encontrada: ${id}`);
          return null;
        }
        console.error('❌ [API_INSTANCE_REPO] Erro ao buscar instância:', error);
        throw new Error(`Erro ao buscar instância: ${error.message}`);
      }

      console.log(`✅ [API_INSTANCE_REPO] Instância encontrada: ${data.instance_name}`);
      return data;
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro geral ao buscar instância:', error);
      throw error;
    }
  }

  async create(instance: ApiInstance): Promise<ApiInstance> {
    try {
      console.log(`🚀 [API_INSTANCE_REPO] Criando nova instância: ${instance.instance_name}`);
      
      // Validar dados obrigatórios
      if (!instance.instance_name || !instance.base_url || !instance.api_key) {
        throw new Error('Dados obrigatórios não fornecidos (instance_name, base_url, api_key)');
      }

      // Validar formato da URL
      try {
        new URL(instance.base_url);
      } catch {
        throw new Error('URL base inválida');
      }

      const { data, error } = await supabase
        .from('api_instances')
        .insert({
          instance_name: instance.instance_name.trim(),
          base_url: instance.base_url.trim().replace(/\/$/, ''), // Remover barra final
          api_key: instance.api_key.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [API_INSTANCE_REPO] Erro Supabase ao criar instância:', error);
        
        // Tratar erros específicos
        if (error.code === '23505') {
          throw new Error('Já existe uma instância com esse nome');
        }
        if (error.code === '42501') {
          throw new Error('Permissão negada para criar instância');
        }
        
        throw new Error(`Erro ao criar instância: ${error.message}`);
      }

      console.log(`✅ [API_INSTANCE_REPO] Instância criada com sucesso: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro geral ao criar instância:', error);
      throw error;
    }
  }

  async update(id: string, instance: Partial<ApiInstance>): Promise<ApiInstance> {
    try {
      console.log(`🔄 [API_INSTANCE_REPO] Atualizando instância: ${id}`);
      
      const updateData: any = {};
      if (instance.instance_name) updateData.instance_name = instance.instance_name.trim();
      if (instance.base_url) {
        // Validar formato da URL
        try {
          new URL(instance.base_url);
          updateData.base_url = instance.base_url.trim().replace(/\/$/, ''); // Remover barra final
        } catch {
          throw new Error('URL base inválida');
        }
      }
      if (instance.api_key) updateData.api_key = instance.api_key.trim();
      
      const { data, error } = await supabase
        .from('api_instances')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [API_INSTANCE_REPO] Erro Supabase ao atualizar instância:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('Instância não encontrada');
        }
        if (error.code === '42501') {
          throw new Error('Permissão negada para atualizar instância');
        }
        
        throw new Error(`Erro ao atualizar instância: ${error.message}`);
      }

      console.log('✅ [API_INSTANCE_REPO] Instância atualizada com sucesso');
      return data;
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro geral ao atualizar instância:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log(`🗑️ [API_INSTANCE_REPO] Excluindo instância: ${id}`);
      
      const { error } = await supabase
        .from('api_instances')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [API_INSTANCE_REPO] Erro Supabase ao excluir instância:', error);
        
        if (error.code === '42501') {
          throw new Error('Permissão negada para excluir instância');
        }
        
        throw new Error(`Erro ao excluir instância: ${error.message}`);
      }

      console.log('✅ [API_INSTANCE_REPO] Instância excluída com sucesso');
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro geral ao excluir instância:', error);
      throw error;
    }
  }

  // Método para testar conexão com uma instância
  async testConnection(instance: ApiInstance): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔍 [API_INSTANCE_REPO] Testando conexão com instância: ${instance.instance_name}`);
      
      const response = await fetch(`${instance.base_url}/instance/connectionState/${instance.instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': instance.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [API_INSTANCE_REPO] Erro ao testar conexão: ${response.status} - ${errorText}`);
        return {
          success: false,
          message: `Erro HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      const isConnected = data.instance?.state === 'open';
      
      console.log(`${isConnected ? '✅' : '⚠️'} [API_INSTANCE_REPO] Status da instância ${instance.instance_name}: ${data.instance?.state}`);
      
      return {
        success: isConnected,
        message: isConnected 
          ? 'Instância conectada e funcionando' 
          : `Instância não conectada. Status: ${data.instance?.state || 'desconhecido'}`
      };
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro ao testar conexão:', error);
      return {
        success: false,
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  // Método para buscar instâncias ativas
  async getActiveInstances(): Promise<ApiInstance[]> {
    try {
      console.log('🔍 [API_INSTANCE_REPO] Buscando instâncias ativas...');
      
      const allInstances = await this.getAll();
      const activeInstances: ApiInstance[] = [];
      
      for (const instance of allInstances) {
        const connectionTest = await this.testConnection(instance);
        if (connectionTest.success) {
          activeInstances.push(instance);
        }
      }
      
      console.log(`✅ [API_INSTANCE_REPO] ${activeInstances.length} instâncias ativas encontradas de ${allInstances.length} total`);
      return activeInstances;
    } catch (error) {
      console.error('❌ [API_INSTANCE_REPO] Erro ao buscar instâncias ativas:', error);
      throw error;
    }
  }
}

