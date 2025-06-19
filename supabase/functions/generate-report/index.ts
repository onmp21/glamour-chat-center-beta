
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
    console.log('🤖 [GENERATE_REPORT] Função iniciada');

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
      console.log('❌ [GENERATE_REPORT] Usuário não autenticado');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [GENERATE_REPORT] Usuário autenticado:', user.id);

    const requestBody = await req.json()
    console.log('📝 [GENERATE_REPORT] Body recebido:', requestBody);

    const { provider_id, report_type, custom_prompt, selected_sheets = [] } = requestBody

    // Buscar o provedor de IA
    const { data: provider, error: providerError } = await supabaseClient
      .from('ai_providers')
      .select('*')
      .eq('id', provider_id)
      .single()

    if (providerError || !provider) {
      console.log('❌ [GENERATE_REPORT] Erro ao buscar provider:', providerError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Provedor de IA não encontrado' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ [GENERATE_REPORT] Provider encontrado:', provider.name);

    // Buscar dados das planilhas selecionadas
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
              .limit(10);
          } else {
            // Tabelas de conversas
            const tableMapping: Record<string, string> = {
              'yelena_ai_conversas': 'yelena_ai_conversas',
              'canarana_conversas': 'canarana_conversas',
              'souto_soares_conversas': 'souto_soares_conversas',
              'joao_dourado_conversas': 'joao_dourado_conversas',
              'america_dourada_conversas': 'america_dourada_conversas',
              'gerente_lojas_conversas': 'gerente_lojas_conversas',
              'gerente_externo_conversas': 'gerente_externo_conversas'
            };

            const tableName = tableMapping[sheetId] || sheetId;
            
            query = supabaseClient
              .from(tableName as any)
              .select('session_id, message, nome_do_contato, tipo_remetente, read_at')
              .limit(10);
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

    // Preparar prompt baseado no tipo de relatório
    let systemPrompt = "Você é um assistente especializado em análise de dados e geração de relatórios em português brasileiro. Analise os dados fornecidos e gere um relatório detalhado, claro e útil."
    let userPrompt = ""

    if (report_type === 'conversations') {
      userPrompt = `Analise as seguintes conversas de WhatsApp e gere um relatório detalhado:

Dados das conversas: ${JSON.stringify(reportData, null, 2)}

Por favor, inclua:
1. Estatísticas gerais
2. Análise de padrões
3. Principais temas
4. Recomendações`

    } else if (report_type === 'exams') {
      userPrompt = `Analise os seguintes dados de exames médicos:

Dados dos exames: ${JSON.stringify(reportData, null, 2)}

Por favor, inclua:
1. Estatísticas de agendamentos
2. Distribuição por cidade
3. Análise temporal
4. Insights e recomendações`

    } else if (report_type === 'custom') {
      userPrompt = custom_prompt || 'Gere um relatório com base nos dados fornecidos.'
      if (reportData && Object.keys(reportData).length > 0) {
        userPrompt += `\n\nDados disponíveis: ${JSON.stringify(reportData, null, 2)}`
      }
    }

    console.log('🔄 [GENERATE_REPORT] Enviando para OpenAI...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        max_tokens: 1500,
        temperature: 0.7
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
    const reportContent = response.choices?.[0]?.message?.content || 'Erro na geração do relatório'

    console.log('✅ [GENERATE_REPORT] Relatório gerado com sucesso');

    // Salvar no histórico
    const { data: savedReport, error: saveError } = await supabaseClient
      .from('report_history')
      .insert({
        provider_id: provider.id,
        report_type,
        prompt: userPrompt,
        generated_report: reportContent,
        model_used: provider.default_model || 'gpt-3.5-turbo',
        tokens_used: response.usage?.total_tokens || 0,
        generation_time: 0,
        report_metadata: {
          user_id: user.id,
          data_size: JSON.stringify(reportData).length
        }
      })
      .select()
      .single()

    if (saveError) {
      console.error('⚠️ [GENERATE_REPORT] Erro ao salvar relatório:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: reportContent,
        metadata: {
          tokens_used: response.usage?.total_tokens || 0,
          model_used: provider.default_model || 'gpt-3.5-turbo',
          report_id: savedReport?.id
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [GENERATE_REPORT] Erro geral:', error)
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
