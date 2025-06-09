
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando geração de relatório...');
    
    // Verificar se a API key do OpenAI está configurada
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY não encontrada nas configurações');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key não configurada. Configure nas Configurações de IA.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { reportData, reportType = 'conversation', aiPrompt } = await req.json();
    console.log('📊 Dados recebidos:', { reportType, hasData: !!reportData, hasPrompt: !!aiPrompt });

    if (!reportData) {
      return new Response(
        JSON.stringify({ error: 'Dados do relatório não fornecidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar prompt baseado no tipo de relatório
    let systemPrompt = '';
    let userPrompt = '';

    if (reportType === 'conversation') {
      systemPrompt = `Você é um assistente especializado em análise de conversas de WhatsApp. 
      Analise as conversas fornecidas e gere um relatório estruturado e profissional.
      Foque em: padrões de comunicação, principais tópicos, sentimentos dos clientes, 
      oportunidades de melhoria no atendimento.`;
      
      userPrompt = aiPrompt || `Analise as seguintes conversas e gere um relatório detalhado:
      
${JSON.stringify(reportData, null, 2)}

Estruture o relatório com:
1. Resumo Executivo
2. Análise de Padrões de Comunicação
3. Principais Tópicos Discutidos
4. Sentimento Geral dos Clientes
5. Recomendações de Melhoria
6. Conclusões`;
    } else {
      systemPrompt = 'Você é um assistente especializado em análise de dados. Gere relatórios claros e estruturados baseados nos dados fornecidos.';
      userPrompt = aiPrompt || `Analise os seguintes dados e gere um relatório: ${JSON.stringify(reportData, null, 2)}`;
    }

    console.log('🤖 Enviando para OpenAI...');
    
    // Fazer requisição para OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('❌ Erro na API OpenAI:', errorData);
      
      if (openaiResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'API key do OpenAI inválida ou expirada. Verifique as Configurações de IA.' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Erro na API OpenAI: ${errorData.error?.message || 'Erro desconhecido'}` 
        }),
        { 
          status: openaiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const aiResult = await openaiResponse.json();
    console.log('✅ Resposta da OpenAI recebida');
    
    const generatedReport = aiResult.choices[0]?.message?.content;
    
    if (!generatedReport) {
      return new Response(
        JSON.stringify({ error: 'Nenhum conteúdo gerado pela IA' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        report: generatedReport,
        success: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na função generate-report:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
