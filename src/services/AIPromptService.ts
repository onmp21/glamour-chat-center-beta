
import { supabase } from '@/integrations/supabase/client';

export interface AIPrompt {
  id: string;
  name: string;
  description?: string;
  prompt_content: string;
  prompt_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AIPromptService {
  static async getPrompts(): Promise<AIPrompt[]> {
    try {
      console.log('📋 [AI_PROMPT_SERVICE] Carregando prompts...');
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AI_PROMPT_SERVICE] Erro ao carregar prompts:', error);
        throw error;
      }

      console.log('✅ [AI_PROMPT_SERVICE] Prompts carregados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [AI_PROMPT_SERVICE] Erro inesperado:', error);
      throw error;
    }
  }

  static async upsertPrompt(prompt: Partial<AIPrompt>): Promise<AIPrompt> {
    try {
      console.log('💾 [AI_PROMPT_SERVICE] Salvando prompt:', prompt.name);
      
      // CORRIGIDO: Validação melhorada antes do salvamento
      if (!prompt.name || !prompt.prompt_content || !prompt.prompt_type) {
        throw new Error('Nome, conteúdo e tipo do prompt são obrigatórios');
      }

      const promptData = {
        name: prompt.name.trim(),
        description: prompt.description?.trim() || null,
        prompt_content: prompt.prompt_content.trim(),
        prompt_type: prompt.prompt_type,
        is_active: prompt.is_active ?? true,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (prompt.id) {
        // Atualizar prompt existente
        console.log('🔄 [AI_PROMPT_SERVICE] Atualizando prompt existente:', prompt.id);
        const { data, error } = await supabase
          .from('ai_prompts')
          .update(promptData)
          .eq('id', prompt.id)
          .select()
          .single();

        if (error) {
          console.error('❌ [AI_PROMPT_SERVICE] Erro ao atualizar prompt:', error);
          throw error;
        }
        result = data;
      } else {
        // Criar novo prompt
        console.log('➕ [AI_PROMPT_SERVICE] Criando novo prompt');
        const { data, error } = await supabase
          .from('ai_prompts')
          .insert([promptData])
          .select()
          .single();

        if (error) {
          console.error('❌ [AI_PROMPT_SERVICE] Erro ao criar prompt:', error);
          throw error;
        }
        result = data;
      }

      console.log('✅ [AI_PROMPT_SERVICE] Prompt salvo com sucesso:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [AI_PROMPT_SERVICE] Erro ao salvar prompt:', error);
      throw error;
    }
  }

  static async deletePrompt(id: string): Promise<void> {
    try {
      console.log('🗑️ [AI_PROMPT_SERVICE] Deletando prompt:', id);
      
      const { error } = await supabase
        .from('ai_prompts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('❌ [AI_PROMPT_SERVICE] Erro ao deletar prompt:', error);
        throw error;
      }

      console.log('✅ [AI_PROMPT_SERVICE] Prompt deletado com sucesso');
    } catch (error) {
      console.error('❌ [AI_PROMPT_SERVICE] Erro ao deletar prompt:', error);
      throw error;
    }
  }

  static async getPromptById(id: string): Promise<AIPrompt | null> {
    try {
      console.log('🔍 [AI_PROMPT_SERVICE] Buscando prompt por ID:', id);
      
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [AI_PROMPT_SERVICE] Prompt não encontrado:', id);
          return null;
        }
        console.error('❌ [AI_PROMPT_SERVICE] Erro ao buscar prompt:', error);
        throw error;
      }

      console.log('✅ [AI_PROMPT_SERVICE] Prompt encontrado:', data.name);
      return data;
    } catch (error) {
      console.error('❌ [AI_PROMPT_SERVICE] Erro ao buscar prompt:', error);
      throw error;
    }
  }
}
