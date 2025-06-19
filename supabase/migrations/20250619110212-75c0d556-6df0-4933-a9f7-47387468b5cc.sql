
-- Inserir prompts padrão para ChatOverlay
INSERT INTO public.ai_prompts (name, description, prompt_content, prompt_type, is_active) VALUES
(
  'Resumo Automático de Conversas',
  'Prompt para gerar resumos automáticos de conversas individuais no ChatOverlay',
  'Analise a conversa e forneça um resumo conciso dos pontos principais discutidos.',
  'conversation_summary',
  true
),
(
  'Resposta Rápida IA', 
  'Prompt para gerar respostas rápidas baseadas no contexto da conversa no ChatOverlay',
  'Com base no contexto da conversa, sugira uma resposta apropriada e profissional.',
  'quick_response',
  true
);

-- Inserir prompts padrão para Relatórios
INSERT INTO public.ai_prompts (name, description, prompt_content, prompt_type, is_active) VALUES
(
  'Resumo Detalhado Individual',
  'Prompt para resumir conversas específicas com mais detalhes em relatórios',
  'Faça um resumo detalhado desta conversa, destacando os pontos principais, problemas identificados e soluções propostas.',
  'summary',
  true
),
(
  'Relatório Estruturado da Conversa',
  'Prompt para relatórios estruturados e formais de conversas',
  'Crie um relatório estruturado desta conversa incluindo: resumo, problemas identificados, ações tomadas e próximos passos.',
  'report',
  true
),
(
  'Análise Completa de Conversas',
  'Prompt para análise detalhada de múltiplas conversas em relatórios',
  'Analise as conversas fornecidas e gere um relatório detalhado com insights sobre padrões de comunicação, volume de mensagens e tendências.',
  'report_conversations',
  true
),
(
  'Performance de Canais',
  'Prompt para análise de performance e engajamento dos canais',
  'Analise os dados dos canais e forneça insights sobre performance, engajamento e oportunidades de melhoria.',
  'report_channels',
  true
),
(
  'Relatório Personalizado',
  'Prompt base para relatórios personalizados e análises específicas',
  'Analise os dados fornecidos e gere um relatório personalizado conforme solicitado.',
  'report_custom',
  true
),
(
  'Análise de Dados de Exames',
  'Prompt para análise estatística de dados de exames médicos',
  'Analise os dados de exames fornecidos e gere um relatório com estatísticas de agendamentos, distribuição por cidade e insights.',
  'report_exams',
  true
);
