
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
    const { provider_id, report_type, data, custom_prompt, filters } = requestBody

    console.log('🤖 [GENERATE_REPORT] Requisição recebida:', { 
      provider_id, 
      report_type, 
      user_id: user.id,
      data_size: JSON.stringify(data).length 
    });

    // Buscar o provedor de IA ou usar configuração padrão
    let { data: provider, error: providerError } = await supabaseClient
      .from('ai_providers')
      .select('*')
      .eq('id', provider_id)
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      // Se não encontrar provedor específico, usar configuração padrão
      console.log(`⚠️ [GENERATE_REPORT] Provider not found for user ${user.id}, using default configuration`);
      
      // Verificar se existe uma API key padrão nas variáveis de ambiente
      const defaultApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!defaultApiKey) {
        return new Response(
          JSON.stringify({ error: 'No AI provider configured and no default API key available' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Usar configuração padrão
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
    let systemPrompt = ""
    let userPrompt = ""

    if (report_type === 'conversations') {
      systemPrompt = "Você é um assistente especializado em análise de conversas de WhatsApp. Analise os dados fornecidos e gere um relatório detalhado e insights úteis em português."
      userPrompt = custom_prompt || `Analise as seguintes conversas e gere um relatório detalhado com insights, estatísticas e recomendações: ${JSON.stringify(data)}`
    } else if (report_type === 'channels') {
      systemPrompt = "Você é um assistente especializado em análise de performance de canais de comunicação. Analise os dados fornecidos e gere um relatório detalhado em português."
      userPrompt = custom_prompt || `Analise os seguintes dados de canais e gere um relatório com métricas, insights e recomendações: ${JSON.stringify(data)}`
    } else {
      systemPrompt = "Você é um assistente especializado em análise de dados e geração de relatórios em português."
      userPrompt = custom_prompt || `Analise os seguintes dados e gere um relatório detalhado: ${JSON.stringify(data)}`
    }

    console.log('🔄 [GENERATE_REPORT] Enviando requisição para OpenAI...');

    // Chamar a API do provedor de IA
    const startTime = Date.now()
    let response: any
    let tokensUsed = 0

    if (provider.provider_type === 'openai') {
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
        throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${errorText}`)
      }

      response = await openaiResponse.json()
      tokensUsed = response.usage?.total_tokens || 0
    } else {
      throw new Error(`Provider type ${provider.provider_type} not supported yet`)
    }

    const generationTime = (Date.now() - startTime) / 1000

    const reportContent = response.choices?.[0]?.message?.content || 'Erro na geração do relatório'

    console.log('✅ [GENERATE_REPORT] Relatório gerado com sucesso. Tokens:', tokensUsed, 'Tempo:', generationTime + 's');

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
          data_size: JSON.stringify(data).length,
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
        error: 'Internal server error',
        message: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
