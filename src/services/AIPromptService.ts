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

export type AIPromptType = 
  | 'conversation_summary'
  | 'quick_response'
  | 'report_conversations'
  | 'report_channels'
  | 'report_custom'
  | 'report_exams'
  | 'summary'
  | 'report';

export interface AIPromptTypeDefinition {
  type: AIPromptType;
  label: string;
  description: string;
  defaultPrompt: string;
}

export function getPromptTypes(): AIPromptTypeDefinition[] {
  return [
    {
      type: 'conversation_summary',
      label: 'Resumo Automático de Conversas',
      description: 'Prompt para gerar resumos automáticos de conversas individuais',
      defaultPrompt: 'Analise a conversa e forneça um resumo conciso dos pontos principais discutidos.'
    },
    {
      type: 'quick_response',
      label: 'Resposta Rápida IA',
      description: 'Prompt para gerar respostas rápidas baseadas no contexto da conversa',
      defaultPrompt: 'Com base no contexto da conversa, sugira uma resposta apropriada e profissional.'
    },
    {
      type: 'summary',
      label: 'Resumo Detalhado Individual',
      description: 'Prompt para resumir conversas específicas com mais detalhes',
      defaultPrompt: 'Faça um resumo detalhado desta conversa, destacando os pontos principais, problemas identificados e soluções propostas.'
    },
    {
      type: 'report',
      label: 'Relatório Estruturado da Conversa',
      description: 'Prompt para relatórios estruturados e formais de conversas',
      defaultPrompt: 'Crie um relatório estruturado desta conversa incluindo: resumo, problemas identificados, ações tomadas e próximos passos.'
    },
    {
      type: 'report_conversations',
      label: 'Análise Completa de Conversas',
      description: 'Prompt para análise detalhada de múltiplas conversas',
      defaultPrompt: 'Analise as conversas fornecidas e gere um relatório detalhado com insights sobre padrões de comunicação, volume de mensagens e tendências.'
    },
    {
      type: 'report_channels',
      label: 'Performance de Canais',
      description: 'Prompt para análise de performance e engajamento dos canais',
      defaultPrompt: 'Analise os dados dos canais e forneça insights sobre performance, engajamento e oportunidades de melhoria.'
    },
    {
      type: 'report_custom',
      label: 'Relatório Personalizado',
      description: 'Prompt base para relatórios personalizados e análises específicas',
      defaultPrompt: 'Analise os dados fornecidos e gere um relatório personalizado conforme solicitado.'
    },
    {
      type: 'report_exams',
      label: 'Análise de Dados de Exames',
      description: 'Prompt para análise estatística de dados de exames médicos',
      defaultPrompt: 'Analise os dados de exames fornecidos e gere um relatório com estatísticas de agendamentos, distribuição por cidade e insights.'
    }
  ];
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

  static async getAllPrompts(): Promise<AIPrompt[]> {
    return this.getPrompts();
  }

  static async upsertPrompt(prompt: Partial<AIPrompt>): Promise<AIPrompt> {
    try {
      console.log('💾 [AI_PROMPT_SERVICE] Salvando prompt:', prompt.name);
      
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
        // Verificar se já existe um prompt do mesmo tipo
        const { data: existingPrompt } = await supabase
          .from('ai_prompts')
          .select('id')
          .eq('prompt_type', prompt.prompt_type)
          .eq('is_active', true)
          .single();

        if (existingPrompt) {
          // Atualizar o prompt existente do mesmo tipo
          console.log('🔄 [AI_PROMPT_SERVICE] Atualizando prompt existente do tipo:', prompt.prompt_type);
          const { data, error } = await supabase
            .from('ai_prompts')
            .update(promptData)
            .eq('id', existingPrompt.id)
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
      }

      console.log('✅ [AI_PROMPT_SERVICE] Prompt salvo com sucesso:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [AI_PROMPT_SERVICE] Erro ao salvar prompt:', error);
      throw error;
    }
  }

  static async restoreDefaultPrompt(type: AIPromptType): Promise<void> {
    try {
      console.log('🔄 [AI_PROMPT_SERVICE] Restaurando prompt padrão:', type);
      
      const promptDef = getPromptTypes().find(p => p.type === type);
      if (!promptDef) {
        throw new Error('Tipo de prompt não encontrado');
      }

      await this.upsertPrompt({
        name: promptDef.label,
        description: promptDef.description,
        prompt_content: promptDef.defaultPrompt,
        prompt_type: type,
        is_active: true
      });

      console.log('✅ [AI_PROMPT_SERVICE] Prompt padrão restaurado');
    } catch (error) {
      console.error('❌ [AI_PROMPT_SERVICE] Erro ao restaurar prompt:', error);
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
