
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🚀 [MIGRATE_BASE64_BATCH] Starting batch migration for all tables')

    // Lista de todas as tabelas de conversas
    const tables = [
      'yelena_ai_conversas',
      'canarana_conversas', 
      'souto_soares_conversas',
      'joao_dourado_conversas',
      'america_dourada_conversas',
      'gerente_lojas_conversas',
      'gerente_externo_conversas'
    ]

    const results = {
      totalProcessed: 0,
      totalErrors: 0,
      tableResults: {} as Record<string, { processed: number; errors: number }>
    }

    // Processar cada tabela
    for (const tableName of tables) {
      console.log(`🔄 [MIGRATE_BASE64_BATCH] Processing table: ${tableName}`)
      
      let tableProcessed = 0
      let tableErrors = 0
      let hasMore = true
      const batchSize = 10

      while (hasMore) {
        try {
          // Buscar mensagens com base64
          const { data: messages, error: fetchError } = await supabase.rpc('get_base64_messages', {
            table_name: tableName,
            batch_size: batchSize
          })

          if (fetchError) {
            console.error(`❌ [MIGRATE_BASE64_BATCH] Fetch error for ${tableName}:`, fetchError)
            tableErrors++
            break
          }

          if (!messages || messages.length === 0) {
            console.log(`✅ [MIGRATE_BASE64_BATCH] No more base64 messages in ${tableName}`)
            hasMore = false
            break
          }

          // Processar cada mensagem
          for (const message of messages) {
            if (message.media_base64 && message.media_base64.startsWith('data:')) {
              try {
                // Upload base64 para storage
                const uploadResult = await uploadBase64ToStorage(supabase, message.media_base64)
                
                if (uploadResult.success && uploadResult.url) {
                  // Atualizar registro na tabela
                  const { error: updateError } = await supabase.rpc('update_media_url', {
                    table_name: tableName,
                    record_id: message.id,
                    media_url: uploadResult.url,
                    placeholder_message: getPlaceholderMessage(message.media_base64)
                  })

                  if (updateError) {
                    console.error(`❌ [MIGRATE_BASE64_BATCH] Update error for message ${message.id}:`, updateError)
                    tableErrors++
                  } else {
                    tableProcessed++
                    console.log(`✅ [MIGRATE_BASE64_BATCH] Migrated message ${message.id} in ${tableName}`)
                  }
                } else {
                  console.error(`❌ [MIGRATE_BASE64_BATCH] Upload failed for message ${message.id}:`, uploadResult.error)
                  tableErrors++
                }

                // Pausa entre uploads para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 200))

              } catch (error) {
                console.error(`❌ [MIGRATE_BASE64_BATCH] Error processing message ${message.id}:`, error)
                tableErrors++
              }
            }
          }

          // Se processou menos que o batch size, não há mais
          if (messages.length < batchSize) {
            hasMore = false
          }

          // Pausa entre batches
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          console.error(`❌ [MIGRATE_BASE64_BATCH] Batch error for ${tableName}:`, error)
          tableErrors++
          break
        }
      }

      results.tableResults[tableName] = {
        processed: tableProcessed,
        errors: tableErrors
      }
      results.totalProcessed += tableProcessed
      results.totalErrors += tableErrors

      console.log(`📊 [MIGRATE_BASE64_BATCH] Table ${tableName} completed: ${tableProcessed} processed, ${tableErrors} errors`)
    }

    console.log(`🎉 [MIGRATE_BASE64_BATCH] Migration completed: ${results.totalProcessed} total processed, ${results.totalErrors} total errors`)

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        message: `Migration completed: ${results.totalProcessed} processed, ${results.totalErrors} errors`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ [MIGRATE_BASE64_BATCH] Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Migration failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function uploadBase64ToStorage(supabase: any, base64Content: string) {
  try {
    // Extrair base64 puro
    const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '')
    
    // Detectar MIME type
    const mimeType = detectMimeType(base64Content)
    
    // Gerar nome do arquivo
    const extension = getExtensionFromMimeType(mimeType)
    const fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${extension}`

    // Converter base64 para blob
    const byteCharacters = atob(cleanBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('media-files')
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Gerar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('media-files')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function detectMimeType(base64Content: string): string {
  if (base64Content.includes('data:')) {
    const match = base64Content.match(/data:([^;]+)/)
    if (match) return match[1]
  }

  const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '')
  
  if (cleanBase64.startsWith('/9j/')) return 'image/jpeg'
  if (cleanBase64.startsWith('iVBORw')) return 'image/png'
  if (cleanBase64.startsWith('R0lGO')) return 'image/gif'
  if (cleanBase64.startsWith('UklGR')) return 'image/webp'
  if (cleanBase64.startsWith('SUQz') || cleanBase64.startsWith('//uQ')) return 'audio/mpeg'
  if (cleanBase64.startsWith('T2dn')) return 'audio/ogg'
  if (cleanBase64.startsWith('AAAAGG') || cleanBase64.startsWith('AAAAFG')) return 'video/mp4'
  
  return 'application/octet-stream'
}

function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'application/pdf': '.pdf'
  }
  return extensions[mimeType] || '.bin'
}

function getPlaceholderMessage(base64Content: string): string {
  const mimeType = detectMimeType(base64Content)
  
  if (mimeType.startsWith('image/')) return '[Imagem]'
  if (mimeType.startsWith('audio/')) return '[Áudio]'
  if (mimeType.startsWith('video/')) return '[Vídeo]'
  if (mimeType === 'application/pdf') return '[Documento PDF]'
  
  return '[Mídia]'
}
