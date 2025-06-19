
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get request body
    const { provider_id, report_type, action_type, data } = await req.json()

    console.log('📊 [GENERATE_REPORT] Request received:', { provider_id, report_type, action_type })

    // Validate required parameters
    if (!provider_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Provider ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get AI provider configuration
    const { data: provider, error: providerError } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('id', provider_id)
      .eq('is_active', true)
      .single()

    if (providerError || !provider) {
      console.error('❌ [GENERATE_REPORT] Provider not found:', providerError)
      return new Response(
        JSON.stringify({ success: false, error: 'Provedor de IA não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get appropriate prompt based on action type
    let promptType = 'conversation_summary'
    if (action_type === 'quick_response') {
      promptType = 'quick_response'
    }

    const { data: promptData } = await supabase
      .from('ai_prompts')
      .select('prompt_content')
      .eq('prompt_type', promptType)
      .eq('is_active', true)
      .single()

    const systemPrompt = promptData?.prompt_content || 'Você é um assistente útil que gera relatórios baseados em dados de conversas.'

    // Prepare messages for AI
    let userMessage = ''
    
    if (action_type === 'quick_response') {
      // For quick responses, format the conversation messages
      const messages = data?.messages || []
      const conversationText = messages.map((msg: any) => 
        `[${msg.tipo_remetente === 'USUARIO_INTERNO' ? 'Agente' : 'Cliente'}]: ${msg.message}`
      ).join('\n')
      
      userMessage = `Baseado na seguinte conversa, sugira 3-5 respostas rápidas apropriadas:\n\n${conversationText}`
    } else {
      // For reports, use the existing format
      userMessage = `Gere um relatório detalhado baseado nos dados fornecidos: ${JSON.stringify(data)}`
    }

    // Call OpenAI API
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
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ [GENERATE_REPORT] OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na API do OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResult = await openaiResponse.json()
    const generatedContent = aiResult.choices[0]?.message?.content || 'Erro ao gerar conteúdo'

    // Save to report history if it's a report (not quick response)
    if (action_type !== 'quick_response') {
      await supabase.from('report_history').insert({
        report_type,
        generated_report: generatedContent,
        provider_id,
        model_used: provider.default_model || 'gpt-3.5-turbo',
        tokens_used: aiResult.usage?.total_tokens || 0,
        prompt: userMessage,
        report_metadata: data
      })
    }

    console.log('✅ [GENERATE_REPORT] Report generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        report: generatedContent,
        content: generatedContent,
        tokens_used: aiResult.usage?.total_tokens || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [GENERATE_REPORT] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
