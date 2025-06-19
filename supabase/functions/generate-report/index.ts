
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de report_type para prompt_type
function getPromptTypeFromReportType(reportType: string): string {
  const mapping: Record<string, string> = {
    'quick_response': 'quick_response',
    'conversation_summary': 'conversation_summary',
    'summary': 'summary',
    'report': 'report',
    'conversations': 'report_conversations',
    'channels': 'report_channels',
    'custom': 'report_custom',
    'exams': 'report_exams'
  };
  
  return mapping[reportType] || 'report_custom';
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
    const { provider_id, report_type, action_type, data, custom_prompt, selected_sheets, table_data } = await req.json()

    console.log('📊 [GENERATE_REPORT] Request received:', { 
      provider_id, 
      report_type, 
      action_type, 
      selected_sheets,
      table_data_keys: table_data ? Object.keys(table_data) : 'none'
    })

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

    // Determine prompt type from report type
    const promptType = getPromptTypeFromReportType(report_type);
    console.log('🎯 [GENERATE_REPORT] Using prompt type:', promptType, 'for report type:', report_type);

    // Get appropriate prompt from database
    const { data: promptData, error: promptError } = await supabase
      .from('ai_prompts')
      .select('prompt_content, name')
      .eq('prompt_type', promptType)
      .eq('is_active', true)
      .single()

    if (promptError && report_type !== 'custom') {
      console.warn('⚠️ [GENERATE_REPORT] Prompt not found for type:', promptType, promptError);
    }

    // Use custom prompt if provided, otherwise use database prompt, fallback to default
    let systemPrompt = '';
    if (custom_prompt && custom_prompt.trim()) {
      systemPrompt = custom_prompt.trim();
      console.log('📝 [GENERATE_REPORT] Using custom prompt');
    } else if (promptData?.prompt_content) {
      systemPrompt = promptData.prompt_content;
      console.log('📝 [GENERATE_REPORT] Using database prompt:', promptData.name);
    } else {
      systemPrompt = 'Você é um assistente útil que gera relatórios baseados em dados de conversas.';
      console.log('📝 [GENERATE_REPORT] Using fallback prompt');
    }

    // Prepare messages for AI
    let userMessage = ''
    
    if (action_type === 'quick_response' || report_type === 'quick_response') {
      // For quick responses, format the conversation messages
      const messages = data?.messages || []
      const conversationText = messages.map((msg: any) => 
        `[${msg.tipo_remetente === 'USUARIO_INTERNO' ? 'Agente' : 'Cliente'}]: ${msg.message}`
      ).join('\n')
      
      userMessage = `Baseado na seguinte conversa, sugira 3-5 respostas rápidas apropriadas:\n\n${conversationText}`
    } else if (action_type === 'conversation_summary' || report_type === 'conversation_summary') {
      // For conversation summary
      const messages = data?.messages || []
      const conversationText = messages.map((msg: any) => 
        `[${msg.tipo_remetente === 'USUARIO_INTERNO' ? 'Agente' : msg.nome_do_contato || 'Cliente'}] (${msg.read_at || 'data não disponível'}): ${msg.message}`
      ).join('\n')
      
      userMessage = `Analise a seguinte conversa e forneça um resumo detalhado:\n\nContato: ${data?.contact_name || 'N/A'}\nCanal: ${data?.channel_id || 'N/A'}\n\nConversa:\n${conversationText}`
    } else {
      // For reports, use table data if available
      if (table_data && Object.keys(table_data).length > 0) {
        let dataDescription = '';
        
        for (const [tableName, records] of Object.entries(table_data)) {
          const recordsArray = records as any[];
          dataDescription += `\n\n=== DADOS DA TABELA: ${tableName.toUpperCase()} ===\n`;
          dataDescription += `Total de registros: ${recordsArray.length}\n`;
          
          if (recordsArray.length > 0) {
            // Mostrar estrutura dos dados
            const sampleRecord = recordsArray[0];
            dataDescription += `Campos disponíveis: ${Object.keys(sampleRecord).join(', ')}\n`;
            
            // Incluir alguns registros de exemplo
            const samplesToShow = Math.min(5, recordsArray.length);
            dataDescription += `\nPrimeiros ${samplesToShow} registros:\n`;
            
            for (let i = 0; i < samplesToShow; i++) {
              const record = recordsArray[i];
              dataDescription += `${i + 1}. `;
              
              if (tableName === 'exams') {
                dataDescription += `Paciente: ${record.patient_name || 'N/A'} | `;
                dataDescription += `Data: ${record.appointment_date || 'N/A'} | `;
                dataDescription += `Cidade: ${record.city || 'N/A'} | `;
                dataDescription += `Status: ${record.status || 'N/A'}`;
              } else {
                dataDescription += `Contato: ${record.nome_do_contato || 'N/A'} | `;
                dataDescription += `Tipo: ${record.tipo_remetente || 'N/A'} | `;
                dataDescription += `Mensagem: ${(record.message || '').substring(0, 100)}${record.message && record.message.length > 100 ? '...' : ''}`;
              }
              dataDescription += '\n';
            }
          }
        }
        
        if (report_type === 'custom') {
          userMessage = `${systemPrompt}\n\nDados disponíveis para análise:${dataDescription}`;
          // Para custom, usar o prompt personalizado como system prompt
          systemPrompt = 'Você é um assistente especializado em análise de dados. Analise os dados fornecidos conforme solicitado.';
        } else {
          userMessage = `Gere um relatório detalhado baseado nos dados fornecidos:${dataDescription}`;
        }
      } else {
        // Fallback para quando não há dados de tabela
        userMessage = custom_prompt || `Gere um relatório do tipo ${report_type}`;
      }
    }

    console.log('🤖 [GENERATE_REPORT] Calling OpenAI with model:', provider.default_model || 'gpt-4o-mini');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.default_model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2000,
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
    if (action_type !== 'quick_response' && report_type !== 'quick_response') {
      const { error: saveError } = await supabase.from('report_history').insert({
        report_type,
        generated_report: generatedContent,
        provider_id,
        model_used: provider.default_model || 'gpt-4o-mini',
        tokens_used: aiResult.usage?.total_tokens || 0,
        prompt: systemPrompt,
        report_metadata: {
          selected_sheets: selected_sheets || [],
          table_data_summary: table_data ? Object.keys(table_data).map(table => ({
            table,
            count: table_data[table]?.length || 0
          })) : [],
          custom_prompt: custom_prompt || null
        }
      })
      
      if (saveError) {
        console.error('⚠️ [GENERATE_REPORT] Error saving to history:', saveError);
      }
    }

    console.log('✅ [GENERATE_REPORT] Report generated successfully using prompt type:', promptType);

    return new Response(
      JSON.stringify({
        success: true,
        report: generatedContent,
        content: generatedContent,
        tokens_used: aiResult.usage?.total_tokens || 0,
        prompt_type_used: promptType,
        prompt_name: promptData?.name || 'Prompt personalizado'
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
