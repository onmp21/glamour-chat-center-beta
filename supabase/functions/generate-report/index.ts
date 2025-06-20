import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_SYSTEM_PROMPT = 'Você é um assistente útil que gera relatórios baseados em dados de conversas.'
const MAX_TOKENS = 2000
const TEMPERATURE = 0.7

// Types
interface ReportRequest {
  provider_id: string
  report_type: string
  action_type: string
  data?: any
  custom_prompt?: string
  selected_sheets?: string[]
  table_data?: Record<string, any[]>
}

interface AIProvider {
  id: string
  api_key: string
  default_model?: string
  is_active: boolean
}

interface PromptData {
  prompt_content: string
  name: string
}

// Utility Functions
function getPromptTypeFromReportType(reportType: string): string {
  const REPORT_TYPE_MAPPING: Record<string, string> = {
    'quick_response': 'quick_response',
    'conversation_summary': 'conversation_summary',
    'summary': 'summary',
    'report': 'report',
    'conversations': 'report_conversations',
    'channels': 'report_channels',
    'custom': 'report_custom',
    'exams': 'report_exams'
  }
  
  return REPORT_TYPE_MAPPING[reportType] || 'report_custom'
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { 
      status, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  )
}

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  )
}

// Data Processing Functions
function formatConversationMessages(messages: any[]): string {
  return messages.map((msg: any) => 
    `[${msg.tipo_remetente === 'USUARIO_INTERNO' ? 'Agente' : 'Cliente'}]: ${msg.message}`
  ).join('\n')
}

function formatConversationSummary(messages: any[], contactName?: string, channelId?: string): string {
  const conversationText = messages.map((msg: any) => 
    `[${msg.tipo_remetente === 'USUARIO_INTERNO' ? 'Agente' : msg.nome_do_contato || 'Cliente'}] (${msg.read_at || 'data não disponível'}): ${msg.message}`
  ).join('\n')
  
  return `Analise a seguinte conversa e forneça um resumo detalhado:\n\nContato: ${contactName || 'N/A'}\nCanal: ${channelId || 'N/A'}\n\nConversa:\n${conversationText}`
}

function formatTableData(tableData: Record<string, any[]>): string {
  let dataDescription = ''
  
  for (const [tableName, records] of Object.entries(tableData)) {
    const recordsArray = records as any[]
    dataDescription += `\n\n=== DADOS DA TABELA: ${tableName.toUpperCase()} ===\n`
    dataDescription += `Total de registros: ${recordsArray.length}\n`
    
    if (recordsArray.length > 0) {
      const sampleRecord = recordsArray[0]
      dataDescription += `Campos disponíveis: ${Object.keys(sampleRecord).join(', ')}\n`
      
      const samplesToShow = Math.min(5, recordsArray.length)
      dataDescription += `\nPrimeiros ${samplesToShow} registros:\n`
      
      for (let i = 0; i < samplesToShow; i++) {
        const record = recordsArray[i]
        dataDescription += `${i + 1}. `
        
        if (tableName === 'exams') {
          dataDescription += formatExamRecord(record)
        } else {
          dataDescription += formatMessageRecord(record)
        }
        dataDescription += '\n'
      }
    }
  }
  
  return dataDescription
}

function formatExamRecord(record: any): string {
  return [
    `Paciente: ${record.patient_name || 'N/A'}`,
    `Data: ${record.appointment_date || 'N/A'}`,
    `Cidade: ${record.city || 'N/A'}`,
    `Status: ${record.status || 'N/A'}`
  ].join(' | ')
}

function formatMessageRecord(record: any): string {
  const messagePreview = record.message 
    ? `${record.message.substring(0, 100)}${record.message.length > 100 ? '...' : ''}`
    : 'N/A'
  
  return [
    `Contato: ${record.nome_do_contato || 'N/A'}`,
    `Tipo: ${record.tipo_remetente || 'N/A'}`,
    `Mensagem: ${messagePreview}`
  ].join(' | ')
}

// Message Generation Functions
function generateUserMessage(request: ReportRequest): string {
  const { action_type, report_type, data, custom_prompt, table_data } = request
  
  if (action_type === 'quick_response' || report_type === 'quick_response') {
    const messages = data?.messages || []
    const conversationText = formatConversationMessages(messages)
    return `Baseado na seguinte conversa, sugira 3-5 respostas rápidas apropriadas:\n\n${conversationText}`
  }
  
  if (action_type === 'conversation_summary' || report_type === 'conversation_summary') {
    const messages = data?.messages || []
    return formatConversationSummary(messages, data?.contact_name, data?.channel_id)
  }
  
  if (table_data && Object.keys(table_data).length > 0) {
    const dataDescription = formatTableData(table_data)
    
    if (report_type === 'custom') {
      return `${custom_prompt || ''}\n\nDados disponíveis para análise:${dataDescription}`
    }
    
    return `Gere um relatório detalhado baseado nos dados fornecidos:${dataDescription}`
  }
  
  return custom_prompt || `Gere um relatório do tipo ${report_type}`
}

function determineSystemPrompt(request: ReportRequest, promptData?: PromptData): string {
  const { custom_prompt, report_type } = request
  
  if (custom_prompt?.trim() && report_type !== 'custom') {
    console.log('📝 [GENERATE_REPORT] Using custom prompt')
    return custom_prompt.trim()
  }
  
  if (promptData?.prompt_content) {
    console.log('📝 [GENERATE_REPORT] Using database prompt:', promptData.name)
    return promptData.prompt_content
  }
  
  if (report_type === 'custom') {
    console.log('📝 [GENERATE_REPORT] Using specialized prompt for custom reports')
    return 'Você é um assistente especializado em análise de dados. Analise os dados fornecidos conforme solicitado.'
  }
  
  console.log('📝 [GENERATE_REPORT] Using fallback prompt')
  return DEFAULT_SYSTEM_PROMPT
}

// Database Functions
async function getAIProvider(supabase: any, providerId: string): Promise<AIProvider | null> {
  const { data: provider, error } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('id', providerId)
    .eq('is_active', true)
    .single()

  if (error || !provider) {
    console.error('❌ [GENERATE_REPORT] Provider not found:', error)
    return null
  }

  return provider
}

async function getPromptData(supabase: any, promptType: string): Promise<PromptData | null> {
  const { data: promptData, error } = await supabase
    .from('ai_prompts')
    .select('prompt_content, name')
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .single()

  if (error) {
    console.warn('⚠️ [GENERATE_REPORT] Prompt not found for type:', promptType, error)
    return null
  }

  return promptData
}

async function saveReportHistory(
  supabase: any, 
  request: ReportRequest, 
  generatedContent: string, 
  provider: AIProvider, 
  aiResult: any, 
  systemPrompt: string
): Promise<void> {
  const { report_type, selected_sheets, table_data, custom_prompt } = request
  
  const { error } = await supabase.from('report_history').insert({
    report_type,
    generated_report: generatedContent,
    provider_id: provider.id,
    model_used: provider.default_model || DEFAULT_MODEL,
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
  
  if (error) {
    console.error('⚠️ [GENERATE_REPORT] Error saving to history:', error)
  }
}

// AI API Functions
async function callOpenAI(provider: AIProvider, systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.default_model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [GENERATE_REPORT] OpenAI API error:', errorText)
    throw new Error('Erro na API do OpenAI')
  }

  return await response.json()
}

// Main Handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse and validate request
    const request: ReportRequest = await req.json()
    const { provider_id, report_type, action_type, selected_sheets, table_data } = request

    console.log('📊 [GENERATE_REPORT] Request received:', { 
      provider_id, 
      report_type, 
      action_type, 
      selected_sheets,
      table_data_keys: table_data ? Object.keys(table_data) : 'none'
    })

    // Validate required parameters
    if (!provider_id) {
      return createErrorResponse('Provider ID é obrigatório')
    }

    // Get AI provider configuration
    const provider = await getAIProvider(supabase, provider_id)
    if (!provider) {
      return createErrorResponse('Provedor de IA não encontrado ou inativo', 404)
    }

    // Determine prompt type and get prompt data
    const promptType = getPromptTypeFromReportType(report_type)
    console.log('🎯 [GENERATE_REPORT] Using prompt type:', promptType, 'for report type:', report_type)

    const promptData = await getPromptData(supabase, promptType)
    
    // Generate prompts
    const systemPrompt = determineSystemPrompt(request, promptData || undefined)
    const userMessage = generateUserMessage(request)

    console.log('🤖 [GENERATE_REPORT] Calling OpenAI with model:', provider.default_model || DEFAULT_MODEL)

    // Call AI API
    const aiResult = await callOpenAI(provider, systemPrompt, userMessage)
    const generatedContent = aiResult.choices[0]?.message?.content || 'Erro ao gerar conteúdo'

    // Save to report history if it's not a quick response
    if (action_type !== 'quick_response' && report_type !== 'quick_response') {
      await saveReportHistory(supabase, request, generatedContent, provider, aiResult, systemPrompt)
    }

    console.log('✅ [GENERATE_REPORT] Report generated successfully using prompt type:', promptType)

    return createSuccessResponse({
      report: generatedContent,
      content: generatedContent,
      tokens_used: aiResult.usage?.total_tokens || 0,
      prompt_type_used: promptType,
      prompt_name: promptData?.name || 'Prompt personalizado'
    })

  } catch (error) {
    console.error('❌ [GENERATE_REPORT] Unexpected error:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
})

