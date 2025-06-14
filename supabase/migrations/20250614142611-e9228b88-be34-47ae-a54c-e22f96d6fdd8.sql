
-- Cria a tabela ai_prompts para armazenar prompts customizados para funções de IA
CREATE TABLE public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prompt_type text NOT NULL, -- Ex: "conversation_summary", "quick_response", "report_conversations", etc
  prompt_content text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para permitir futuras políticas de acesso (opcional neste momento)
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
