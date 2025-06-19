
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestBody = await req.json()
    const { provider_id, report_type, custom_prompt, selected_sheets = [], filters } = requestBody

    console.log('🤖 [GENERATE_REPORT] Requisição recebida:', { 
      provider_id, 
      report_type, 
      user_id: user.id,
      selected_sheets_count: selected_sheets.length,
      filters
    });

    // Buscar dados das planilhas selecionadas
    console.log('📊 [GENERATE_REPORT] Buscando dados das planilhas:', selected_sheets);
    const reportData: any = {};

    if (selected_sheets && selected_sheets.length > 0) {
      for (const sheetId of selected_sheets) {
        try {
          console.log(`🔍 [GENERATE_REPORT] Buscando dados de: ${sheetId}`);
          
          let query;
          if (sheetId === 'exams') {
            query = supabaseClient
              .from('exams')
              .select('patient_name, phone, city, appointment_date, status, exam_type')
              .limit(50)
              .order('appointment_date', { ascending: false });
          } else {
            // Tabelas de conversas
            query = supabaseClient
              .from(sheetId as any)
              .select('session_id, message, nome_do_contato, tipo_remetente, read_at')
              .limit(100)
              .order('read_at', { ascending: false });
          }
          
          const { data, error } = await query;
          
          if (error) {
            console.error(`❌ [GENERATE_REPORT] Erro ao buscar ${sheetId}:`, error);
            continue;
          }
          
          reportData[sheetId] = data || [];
          console.log(`✅ [GENERATE_REPORT] ${data?.length || 0} registros de ${sheetId}`);
        } catch (err) {
          console.error(`❌ [GENERATE_REPORT] Erro ao processar ${sheetId}:`, err);
        }
      }
    }

    // Buscar o provedor de IA
    let { data: provider, error: providerError } = await supabaseClient
      .from('ai_providers')
      .select('*')
      .eq('id', provider_id)
      .single()

    if (providerError || !provider) {
      console.log(`⚠️ [GENERATE_REPORT] Provider not found: ${provider_id}, using default`);
      
      const defaultApiKey = Deno.env.get('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');
      if (!defaultApiKey) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Nenhum provedor de IA configurado e nenhuma chave padrão disponível' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      provider = {
        id: 'default',
        provider_type: 'openai',
        api_key: defaultApiKey,
        base_url: 'https://api.openai.com/v1/chat/completions',
        default_model: 'gpt-3.5-turbo',
        advanced_settings: {}
      };
    }

    // Preparar prompt baseado no tipo de relatório
    let systemPrompt = "Você é um assistente especializado em análise de dados e geração de relatórios em português brasileiro. Analise os dados fornecidos e gere um relatório detalhado, claro e útil."
    let userPrompt = ""

    if (report_type === 'conversations') {
      userPrompt = `Analise as seguintes conversas de WhatsApp e gere um relatório detalhado com insights, estatísticas e recomendações sobre o atendimento ao cliente:

Dados das conversas: ${JSON.stringify(reportData, null, 2)}

Por favor, inclua:
1. Estatísticas gerais (total de mensagens, conversas, etc.)
2. Análise de padrões de comunicação
3. Identificação de temas principais
4. Qualidade do atendimento
5. Recomendações de melhoria`

    } else if (report_type === 'exams') {
      userPrompt = `Analise os seguintes dados de exames médicos e gere um relatório detalhado:

Dados dos exames: ${JSON.stringify(reportData, null, 2)}

Por favor, inclua:
1. Estatísticas de agendamentos
2. Distribuição por cidade
3. Análise temporal
4. Status dos exames
5. Insights e recomendações`

    } else if (report_type === 'custom') {
      userPrompt = custom_prompt || 'Gere um relatório com base nos dados fornecidos.'
      if (reportData && Object.keys(reportData).length > 0) {
        userPrompt += `\n\nDados disponíveis: ${JSON.stringify(reportData, null, 2)}`
      }
    }

    console.log('🔄 [GENERATE_REPORT] Enviando para OpenAI...');

    const startTime = Date.now()
    
    const openaiResponse = await fetch(provider.base_url || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.default_model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        ...provider.advanced_settings
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ [GENERATE_REPORT] OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro na API OpenAI: ${openaiResponse.statusText}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const response = await openaiResponse.json()
    const generationTime = (Date.now() - startTime) / 1000
    const tokensUsed = response.usage?.total_tokens || 0
    const reportContent = response.choices?.[0]?.message?.content || 'Erro na geração do relatório'

    console.log('✅ [GENERATE_REPORT] Relatório gerado. Tokens:', tokensUsed, 'Tempo:', generationTime + 's');

    // Salvar no histórico
    const { data: savedReport, error: saveError } = await supabaseClient
      .from('report_history')
      .insert({
        provider_id: provider.id,
        report_type,
        prompt: userPrompt,
        generated_report: reportContent,
        model_used: provider.default_model,
        tokens_used: tokensUsed,
        generation_time: generationTime,
        report_metadata: {
          filters,
          data_size: JSON.stringify(reportData).length,
          user_id: user.id
        }
      })
      .select()
      .single()

    if (saveError) {
      console.error('⚠️ [GENERATE_REPORT] Error saving report:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: reportContent,
        metadata: {
          tokens_used: tokensUsed,
          generation_time: generationTime,
          model_used: provider.default_model,
          report_id: savedReport?.id
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [GENERATE_REPORT] Error generating report:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor',
        details: error.message || error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
