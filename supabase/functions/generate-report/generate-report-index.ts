import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Chave da API do OpenAI - Deve ser armazenada como variável de ambiente em produção
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || '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';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = 'report', data = null } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determinar o sistema prompt com base no tipo de solicitação
    let systemPrompt = '';
    
    if (type === 'report') {
      systemPrompt = `Você é um assistente especializado em gerar relatórios detalhados e profissionais para sistemas de atendimento ao cliente. 
      
      Suas características:
      - Gera relatórios bem estruturados com seções claras
      - Inclui insights baseados em dados quando possível
      - Usa linguagem profissional mas acessível
      - Fornece recomendações práticas
      - Formata o texto de forma organizada com títulos e subtítulos
      - Usa Markdown para formatação
      
      Sempre structure seus relatórios da seguinte forma:
      1. Título do Relatório (use # para título principal)
      2. Período Analisado (use ## para subtítulos)
      3. Resumo Executivo (use ## para subtítulos)
      4. Análise Detalhada (use ## para subtítulos e ### para seções menores)
      5. Insights e Tendências (use ## para subtítulos)
      6. Recomendações (use ## para subtítulos)
      7. Conclusão (use ## para subtítulos)
      
      Use formatação Markdown para melhorar a legibilidade:
      - **Negrito** para pontos importantes
      - *Itálico* para ênfase
      - Listas com - ou 1. para enumerações
      - > para citações ou destaques
      - --- para separar seções
      
      Inclua dados fictícios mas realistas para ilustrar pontos quando apropriado.`;
    } else if (type === 'backup') {
      systemPrompt = `Você é um assistente especializado em analisar e documentar backups de dados de sistemas de atendimento ao cliente.
      
      Suas características:
      - Gera documentação detalhada sobre os dados de backup
      - Identifica padrões e anomalias nos dados
      - Fornece recomendações para melhorar a qualidade dos dados
      - Usa linguagem técnica mas compreensível
      - Formata o texto de forma organizada com títulos e subtítulos
      - Usa Markdown para formatação
      
      Sempre structure seus relatórios de backup da seguinte forma:
      1. Título do Relatório de Backup (use # para título principal)
      2. Resumo dos Dados (use ## para subtítulos)
      3. Estatísticas do Backup (use ## para subtítulos)
      4. Integridade dos Dados (use ## para subtítulos)
      5. Recomendações (use ## para subtítulos)
      
      Use formatação Markdown para melhorar a legibilidade:
      - **Negrito** para pontos importantes
      - *Itálico* para ênfase
      - Listas com - ou 1. para enumerações
      - \`código\` para valores técnicos ou identificadores
      - --- para separar seções`;
    } else if (type === 'analysis') {
      systemPrompt = `Você é um analista de dados especializado em sistemas de atendimento ao cliente.
      
      Suas características:
      - Analisa dados de conversas e interações com clientes
      - Identifica padrões, tendências e insights valiosos
      - Fornece recomendações baseadas em dados
      - Usa linguagem analítica mas acessível
      - Formata o texto de forma organizada com títulos e subtítulos
      - Usa Markdown para formatação
      
      Sempre structure suas análises da seguinte forma:
      1. Título da Análise (use # para título principal)
      2. Metodologia (use ## para subtítulos)
      3. Principais Descobertas (use ## para subtítulos)
      4. Análise Detalhada (use ## para subtítulos e ### para seções menores)
      5. Insights Acionáveis (use ## para subtítulos)
      6. Recomendações (use ## para subtítulos)
      
      Use formatação Markdown para melhorar a legibilidade:
      - **Negrito** para pontos importantes
      - *Itálico* para ênfase
      - Listas com - ou 1. para enumerações
      - Tabelas para apresentar dados comparativos
      - --- para separar seções`;
    }

    // Construir mensagens para a API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Adicionar dados se fornecidos
    if (data) {
      messages.push({
        role: 'user',
        content: `Aqui estão os dados para análise:\n\n${JSON.stringify(data, null, 2)}`
      });
    }

    // Chamar a API do OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Gerar HTML formatado a partir do Markdown
    const htmlContent = markdownToHTML(content);

    return new Response(
      JSON.stringify({ 
        content, 
        htmlContent,
        type,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating content:', error);
    return new Response(
      JSON.stringify({ error: `Erro ao gerar conteúdo: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Função para converter Markdown para HTML
function markdownToHTML(markdown) {
  // Converter cabeçalhos
  let html = markdown
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-base font-bold my-2">$1</h4>');

  // Converter formatação de texto
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');

  // Converter listas
  html = html
    .replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-6 list-decimal">$1</li>')
    .replace(/^\s*-\s+(.*$)/gm, '<li class="ml-6 list-disc">$1</li>');
  
  // Agrupar itens de lista
  html = html
    .replace(/<\/li>\n<li class="ml-6 list-decimal">/g, '</li><li class="ml-6 list-decimal">')
    .replace(/<\/li>\n<li class="ml-6 list-disc">/g, '</li><li class="ml-6 list-disc">');
  
  // Envolver listas em tags <ul> ou <ol>
  html = html
    .replace(/(<li class="ml-6 list-decimal">.*?<\/li>)/gs, '<ol class="my-2">$1</ol>')
    .replace(/(<li class="ml-6 list-disc">.*?<\/li>)/gs, '<ul class="my-2">$1</ul>');

  // Converter citações
  html = html
    .replace(/^>\s+(.*$)/gm, '<blockquote class="pl-4 border-l-4 border-gray-300 italic my-2">$1</blockquote>');

  // Converter separadores
  html = html
    .replace(/^---$/gm, '<hr class="my-4 border-t border-gray-300">');

  // Converter parágrafos (linhas que não são cabeçalhos, listas, etc.)
  html = html
    .replace(/^(?!<h|<ul|<ol|<li|<blockquote|<hr)(.*$)/gm, '<p class="my-2">$1</p>');

  // Remover parágrafos vazios
  html = html
    .replace(/<p class="my-2"><\/p>/g, '');

  // Adicionar quebras de linha
  html = html.replace(/\n/g, '');

  // Envolver tudo em um div com estilos
  html = `<div class="report-container font-sans text-gray-800 leading-normal p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200">
    <div class="report-header mb-6 pb-4 border-b border-gray-200">
      <div class="text-[#b5103c] text-sm uppercase font-bold tracking-wider mb-1">Glamour Chat Center</div>
      <div class="text-gray-400 text-xs">Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
    <div class="report-content">
      ${html}
    </div>
    <div class="report-footer mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
      © ${new Date().getFullYear()} Glamour Chat Center • Todos os direitos reservados
    </div>
  </div>`;

  return html;
}

