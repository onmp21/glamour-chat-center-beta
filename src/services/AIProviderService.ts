
import { supabase } from '@/integrations/supabase/client';
import { AIProvider, AIProviderFormData, ProviderType } from '@/types/ai-providers';

export class AIProviderService {
  static async getProviders(): Promise<AIProvider[]> {
    console.log('🔍 [AI_PROVIDER_SERVICE] Getting providers with direct query');
    
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [AI_PROVIDER_SERVICE] Error fetching AI providers:', error);
      throw new Error('Erro ao carregar provedores de IA');
    }

    console.log(`✅ [AI_PROVIDER_SERVICE] Found ${data?.length || 0} providers`);

    return (data || []).map(provider => ({
      ...provider,
      provider_type: provider.provider_type as ProviderType,
      advanced_settings: (provider.advanced_settings as Record<string, any>) || {},
      created_at: provider.created_at || new Date().toISOString(),
      updated_at: provider.updated_at || new Date().toISOString(),
      is_active: provider.is_active ?? true,
      api_key: provider.api_key || '',
      base_url: provider.base_url || '',
      default_model: provider.default_model || '',
      user_id: provider.user_id || ''
    }));
  }

  static async getActiveProviders(): Promise<AIProvider[]> {
    return this.getProviders();
  }

  static async createProvider(
    formData: AIProviderFormData, 
    userId?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('📝 [AI_PROVIDER_SERVICE] Creating provider with custom user ID:', userId);

      const insertData = {
        name: formData.name,
        provider_type: formData.provider_type,
        api_key: formData.api_key,
        base_url: formData.base_url,
        default_model: formData.default_model,
        is_active: formData.is_active,
        advanced_settings: formData.advanced_settings || {},
        user_id: userId || null // Usar o user_id passado do contexto customizado
      };

      const { error } = await supabase
        .from('ai_providers')
        .insert(insertData);

      if (error) {
        console.error('❌ [AI_PROVIDER_SERVICE] Error creating AI provider:', error);
        return { success: false, error: error.message, message: error.message };
      }

      console.log('✅ [AI_PROVIDER_SERVICE] Provider created successfully');
      return { success: true, message: 'Provedor criado com sucesso' };
    } catch (error) {
      console.error('❌ [AI_PROVIDER_SERVICE] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async updateProvider(
    id: string, 
    formData: AIProviderFormData,
    userId?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('🔄 [AI_PROVIDER_SERVICE] Updating provider:', id, 'for user:', userId);

      const updateData = {
        name: formData.name,
        provider_type: formData.provider_type,
        api_key: formData.api_key,
        base_url: formData.base_url,
        default_model: formData.default_model,
        is_active: formData.is_active,
        advanced_settings: formData.advanced_settings || {}
      };

      // Se userId foi fornecido, aplicar filtro por user_id
      let query = supabase
        .from('ai_providers')
        .update(updateData)
        .eq('id', id);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ [AI_PROVIDER_SERVICE] Error updating AI provider:', error);
        return { success: false, error: error.message, message: error.message };
      }

      console.log('✅ [AI_PROVIDER_SERVICE] Provider updated successfully');
      return { success: true, message: 'Provedor atualizado com sucesso' };
    } catch (error) {
      console.error('❌ [AI_PROVIDER_SERVICE] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async deleteProvider(id: string, userId?: string): Promise<void> {
    console.log('🗑️ [AI_PROVIDER_SERVICE] Deleting provider:', id, 'for user:', userId);
    
    let query = supabase
      .from('ai_providers')
      .delete()
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ [AI_PROVIDER_SERVICE] Error deleting AI provider:', error);
      throw new Error('Erro ao excluir provedor');
    }

    console.log('✅ [AI_PROVIDER_SERVICE] Provider deleted successfully');
  }

  static async testProvider(id: string): Promise<{ success: boolean; error?: string; message?: string }> {
    console.log('🧪 [AI_PROVIDER_SERVICE] Testing provider:', id);
    
    // Mock implementation for testing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Provedor testado com sucesso' });
      }, 1000);
    });
  }

  static getProviderTypeLabel(type: ProviderType): string {
    const labels = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      custom: 'Personalizado'
    };
    return labels[type] || type;
  }
}
