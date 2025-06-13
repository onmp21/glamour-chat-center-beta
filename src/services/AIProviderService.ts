
import { supabase } from '@/integrations/supabase/client';
import { AIProvider, AIProviderFormData, ProviderType } from '@/types/ai-providers';

export class AIProviderService {
  static async getProviders(): Promise<AIProvider[]> {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI providers:', error);
      throw error;
    }

    return (data || []).map(row => ({
      ...row,
      provider_type: row.provider_type as ProviderType,
      advanced_settings: row.advanced_settings as Record<string, any>
    }));
  }

  static async getActiveProviders(): Promise<AIProvider[]> {
    const providers = await this.getProviders();
    return providers.filter(provider => provider.is_active);
  }

  static async createProvider(formData: AIProviderFormData): Promise<AIProvider> {
    const { data, error } = await supabase
      .from('ai_providers')
      .insert({
        name: formData.name,
        provider_type: formData.provider_type,
        api_key: formData.api_key,
        base_url: formData.base_url,
        default_model: formData.default_model,
        is_active: formData.is_active,
        advanced_settings: formData.advanced_settings || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI provider:', error);
      throw error;
    }

    return {
      ...data,
      provider_type: data.provider_type as ProviderType,
      advanced_settings: data.advanced_settings as Record<string, any>
    };
  }

  static async updateProvider(id: string, formData: AIProviderFormData): Promise<AIProvider> {
    const { data, error } = await supabase
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
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating AI provider:', error);
      throw error;
    }

    return {
      ...data,
      provider_type: data.provider_type as ProviderType,
      advanced_settings: data.advanced_settings as Record<string, any>
    };
  }

  static async deleteProvider(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting AI provider:', error);
      throw error;
    }
  }

  static async testProvider(id: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Mock test implementation
      console.log(`Testing provider ${id}`);
      return { success: true, message: 'Provider test successful' };
    } catch (error) {
      return { success: false, error: String(error), message: 'Provider test failed' };
    }
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
