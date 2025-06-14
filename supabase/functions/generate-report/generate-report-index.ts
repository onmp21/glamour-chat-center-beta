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
    const body = await req.json();
    // Recebe campos personalizados do frontend
    const { prompt, type = 'report', action_type = null, data = null, custom_prompt = null } = body;

    if (!prompt && !custom_prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determinar sistema prompt/contexto conforme tipo ou action_type
    let systemPrompt = '';
    let userPrompt = custom_prompt || prompt;

    // Mensagens de contexto recebidas do frontend (data.messages) — para quick_response, summary, report
    const ctxMessages = data?.messages || [];

    // Determina contexto para cada ação/prompt orientada
    if (action_type === 'quick_response') {
      // Quick response: usar histórico e focar última do cliente
      // Encontra última mensagem do cliente
      const lastCustomerMsg = [...ctxMessages].reverse().find(
        m => m.tipo_remetente === 'customer' || m.tipo_remetente === 'CONTATO_EXTERNO'
      );
      const lastMsg = lastCustomerMsg?.message || (ctxMessages.length > 0 ? ctxMessages[ctxMessages.length - 1].message : '');

      systemPrompt = `Você é um assistente de atendimento ao cliente. Sempre gere sugestões de resposta rápidas, breves e profissionais, levando em conta todo o contexto da conversa.`;
      userPrompt = `Considere todo o histórico desta conversa entre cliente e atendente abaixo. Sugira uma resposta adequada, gentil e profissional para a ÚLTIMA mensagem enviada pelo cliente:\n\n`;
      ctxMessages.forEach(msg => {
        const sender = msg.tipo_remetente === 'customer' || msg.tipo_remetente === 'CONTATO_EXTERNO'
          ? (msg.nome_do_contato || "Cliente")
          : 'Atendente';
        userPrompt += `${sender}: ${msg.message}\n`;
      });
      userPrompt += `\nResponder a seguinte mensagem do cliente:\n"${lastMsg}"\nResposta sugerida:`;
    } else if (action_type === 'summary') {
      // Summary: resumir toda conversa da sessão
      systemPrompt = `Você é um assistente especializado em resumir conversas de atendimento ao cliente, destacando os principais pontos, temas e possíveis pendências. Seja objetivo.`;
      userPrompt = custom_prompt ||
        `Resuma de forma clara, concisa e completa a conversa abaixo entre cliente e atendente:\n\n` +
        ctxMessages.map(msg => {
          const sender = msg.tipo_remetente === 'customer' || msg.tipo_remetente === 'CONTATO_EXTERNO'
            ? (msg.nome_do_contato || "Cliente")
            : 'Atendente';
          return `${sender}: ${msg.message}`;
        }).join('\n');
    } else if (action_type === 'report' || type === 'report') {
      // Report: relatório detalhado da sessão
      systemPrompt = `Você é um assistente especialista em gerar relatórios detalhados e profissionais sobre conversas de atendimento ao cliente.`;
      userPrompt = custom_prompt ||
        `Com base em toda a conversa abaixo, gere um relatório estruturado com:
        1. Resumo da conversa
        2. Principais assuntos discutidos
        3. Problemas identificados
        4. Soluções propostas
        5. Análise de sentimento do cliente e sugestões de melhoria.
        
        Use títulos, subtítulos e formatação em Markdown para facilitar. Mensagens:\n\n` +
        ctxMessages.map(msg => {
          const sender = msg.tipo_remetente === 'customer' || msg.tipo_remetente === 'CONTATO_EXTERNO'
            ? (msg.nome_do_contato || "Cliente")
            : 'Atendente';
          return `${sender}: ${msg.message}`;
        }).join('\n');
    } else {
      // Fallback: usar prompts antigos ou o prompt informado
      systemPrompt = '';
      userPrompt = custom_prompt || prompt;
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (userPrompt) {
      messages.push({ role: 'user', content: userPrompt });
    }
    // Evita repetir messages/data

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const resp = await response.json();
    const content = resp.choices[0].message.content;

    // Gerar HTML formatado a partir do Markdown
    const htmlContent = markdownToHTML(content);

    return new Response(
      JSON.stringify({ 
        content, 
        htmlContent,
        type: action_type || type,
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
