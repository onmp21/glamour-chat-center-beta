import { supabase } from "@/integrations/supabase/client";

export type AIPromptType =
  | "conversation_summary"
  | "quick_response"
  | "report_conversations"
  | "report_channels"
  | "report_custom"
  | "report_exams";

export interface AIPrompt {
  id: string;
  name: string;
  prompt_type: AIPromptType;
  prompt_content: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const PROMPT_TYPES: { type: AIPromptType; label: string; description: string; defaultPrompt: string }[] = [
  {
    type: "conversation_summary",
    label: "Resumo de Conversa",
    description: "Prompt para a função de resumir conversas.",
    defaultPrompt: "Você deve resumir esta conversa, destacando os pontos principais, ações pendentes e sentimento do cliente. Seja objetivo.",
  },
  {
    type: "quick_response",
    label: "Resposta Rápida",
    description: "Prompt para sugerir uma resposta rápida baseada no contexto e última mensagem.",
    defaultPrompt: "Com base no contexto da conversa e na última mensagem recebida, gere uma resposta breve e útil para o cliente.",
  },
  {
    type: "report_conversations",
    label: "Relatório de Conversas",
    description: "Prompt para geração de relatório focado em conversas.",
    defaultPrompt: "Analise todos os dados de conversas e gere um relatório com padrões, volume, sentimento e insights relevantes.",
  },
  {
    type: "report_channels",
    label: "Relatório de Canais",
    description: "Prompt para relatório global sobre canais.",
    defaultPrompt: "Analise os dados dos canais e forneça insights sobre performance, mensagens enviadas e recebidas, gargalos e oportunidades.",
  },
  {
    type: "report_custom",
    label: "Relatório Personalizado",
    description: "Prompt para relatórios totalmente customizáveis pelo usuário.",
    defaultPrompt: "Use este espaço para criar prompts customizados para relatórios inteligentes.",
  },
  {
    type: "report_exams",
    label: "Relatório de Exames",
    description: "Prompt para relatório focado em exames (agendados, realizados, pendentes).",
    defaultPrompt: "Analise os dados dos exames e gere um relatório detalhado sobre agendamentos, status dos exames, taxas de conclusão e insights relevantes. Destaque exames pendentes, resolvidos e qualquer tendência perceptível nos dados.",
  },
];

export const getPromptTypes = () => PROMPT_TYPES;

export class AIPromptService {
  static async getAllPrompts(): Promise<AIPrompt[]> {
    const { data, error } = await supabase
      .from("ai_prompts")
      .select("*")
      .order("prompt_type", { ascending: true });

    if (error) {
      console.error("[AIPromptService] Erro ao buscar prompts:", error);
      return [];
    }
    return data as AIPrompt[];
  }

  static async upsertPrompt(prompt: Partial<AIPrompt> & { prompt_type: AIPromptType }) {
    // Garante campos obrigatórios, senão lança erro para dev.
    const label = getPromptTypes().find((p) => p.type === prompt.prompt_type)?.label || "";
    const prompt_content = typeof prompt.prompt_content === "string" ? prompt.prompt_content : "";
    if (!label || !prompt_content) {
      throw new Error("Campos obrigatórios (name, prompt_content) ausentes no upsertPrompt");
    }
    let upsertObj = {
      ...prompt,
      name: label,
      prompt_content,
      is_active: typeof prompt.is_active === "boolean" ? prompt.is_active : true,
      updated_at: new Date().toISOString(),
    };
    // upsert espera um array de objetos
    const { data, error } = await supabase
      .from("ai_prompts")
      .upsert([upsertObj], { onConflict: "prompt_type" })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as AIPrompt;
  }

  static async restoreDefaultPrompt(prompt_type: AIPromptType) {
    const promptObj = PROMPT_TYPES.find((p) => p.type === prompt_type);
    if (!promptObj) return;
    const { data, error } = await supabase
      .from("ai_prompts")
      .upsert(
        [
          {
            prompt_type,
            name: promptObj.label,
            prompt_content: promptObj.defaultPrompt,
            description: promptObj.description,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "prompt_type" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as AIPrompt;
  }
}
