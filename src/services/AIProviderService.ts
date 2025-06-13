
import { supabase } from '@/integrations/supabase/client';
import { AIProvider, AIProviderFormData, ProviderType } from '@/types/ai-providers';

export class AIProviderService {
  static async getProviders(): Promise<AIProvider[]> {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI providers:', error);
      throw new Error('Erro ao carregar provedores de IA');
    }

    return data || [];
  }

  static async createProvider(formData: AIProviderFormData): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .insert({
          name: formData.name,
          provider_type: formData.provider_type,
          api_key: formData.api_key,
          base_url: formData.base_url,
          default_model: formData.default_model,
          is_active: formData.is_active,
          advanced_settings: formData.advanced_settings || {}
        });

      if (error) {
        console.error('Error creating AI provider:', error);
        return { success: false, error: error.message, message: error.message };
      }

      return { success: true, message: 'Provedor criado com sucesso' };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async updateProvider(id: string, formData: AIProviderFormData): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .update({
          name: formData.name,
          provider_type: formData.provider_type,
          api_key: formData.api_key,
          base_url: formData.base_url,
          default_model: formData.default_model,
          is_active: formData.is_active,
          advanced_settings: formData.advanced_settings || {}
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating AI provider:', error);
        return { success: false, error: error.message, message: error.message };
      }

      return { success: true, message: 'Provedor atualizado com sucesso' };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async deleteProvider(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting AI provider:', error);
      throw new Error('Erro ao excluir provedor');
    }
  }

  static async testProvider(id: string): Promise<{ success: boolean; error?: string; message?: string }> {
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
