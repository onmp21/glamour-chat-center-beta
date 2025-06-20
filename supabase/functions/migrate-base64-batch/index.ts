import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONVERSATION_TABLES = [
  'yelena_ai_conversas',
  'canarana_conversas', 
  'souto_soares_conversas',
  'joao_dourado_conversas',
  'america_dourada_conversas',
  'gerente_lojas_conversas',
  'gerente_externo_conversas'
]

const BATCH_SIZE = 10
const MESSAGE_DELAY = 200 // ms
const BATCH_DELAY = 500 // ms
const STORAGE_BUCKET = 'media-files'

// Types
interface BatchMigrationResults {
  totalProcessed: number
  totalErrors: number
  tableResults: Record<string, TableResult>
}

interface TableResult {
  processed: number
  errors: number
}

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

interface MessageRecord {
  id: string
  media_base64: string
}

// Utility Functions
function createErrorResponse(message: string, error?: string, status: number = 500) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error || 'Unknown error',
      message 
    }),
    { 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status 
    }
  )
}

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({ 
      success: true, 
      ...data 
    }),
    { 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

// MIME Type and File Utilities (reused from migrate-base64)
class MediaTypeUtils {
  private static readonly MIME_SIGNATURES: Record<string, string> = {
    '/9j/': 'image/jpeg',
    'iVBORw': 'image/png',
    'R0lGO': 'image/gif',
    'UklGR': 'image/webp',
    'SUQz': 'audio/mpeg',
    '//uQ': 'audio/mpeg',
    'T2dn': 'audio/ogg',
    'AAAAGG': 'video/mp4',
    'AAAAFG': 'video/mp4'
  }

  private static readonly EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'application/pdf': '.pdf'
  }

  private static readonly PLACEHOLDERS: Record<string, string> = {
    'image': '[Imagem]',
    'audio': '[Áudio]',
    'video': '[Vídeo]',
    'application/pdf': '[Documento PDF]'
  }

  static detectMimeType(base64Content: string): string {
    // Check for data URL format
    if (base64Content.includes('data:')) {
      const match = base64Content.match(/data:([^;]+)/)
      if (match) return match[1]
    }

    // Clean base64 content and check signatures
    const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '')
    
    for (const [signature, mimeType] of Object.entries(this.MIME_SIGNATURES)) {
      if (cleanBase64.startsWith(signature)) {
        return mimeType
      }
    }
    
    return 'application/octet-stream'
  }

  static getExtension(mimeType: string): string {
    return this.EXTENSIONS[mimeType] || '.bin'
  }

  static getPlaceholder(mimeType: string): string {
    const category = mimeType.split('/')[0]
    return this.PLACEHOLDERS[category] || this.PLACEHOLDERS[mimeType] || '[Mídia]'
  }

  static generateFileName(mimeType: string): string {
    const extension = this.getExtension(mimeType)
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    return `media_${timestamp}_${randomId}${extension}`
  }
}

// Base64 Processing
class Base64Processor {
  static convertToBlob(base64Content: string): { blob: Blob, mimeType: string } {
    const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '')
    const mimeType = MediaTypeUtils.detectMimeType(base64Content)
    
    const byteCharacters = atob(cleanBase64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    
    return { blob, mimeType }
  }
}

// Storage Service
class StorageService {
  constructor(private supabase: any) {}

  async uploadBase64(base64Content: string): Promise<UploadResult> {
    try {
      const { blob, mimeType } = Base64Processor.convertToBlob(base64Content)
      const fileName = MediaTypeUtils.generateFileName(mimeType)

      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: true
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Generate public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path)

      return { success: true, url: publicUrl }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Database Service
class DatabaseService {
  constructor(private supabase: any) {}

  async getBase64Messages(tableName: string, batchSize: number): Promise<MessageRecord[]> {
    const { data: messages, error } = await this.supabase.rpc('get_base64_messages', {
      table_name: tableName,
      batch_size: batchSize
    })

    if (error) {
      throw new Error(`Failed to fetch messages from ${tableName}: ${error.message}`)
    }

    return messages || []
  }

  async updateMediaUrl(tableName: string, recordId: string, mediaUrl: string, placeholderMessage: string): Promise<void> {
    const { error } = await this.supabase.rpc('update_media_url', {
      table_name: tableName,
      record_id: recordId,
      media_url: mediaUrl,
      placeholder_message: placeholderMessage
    })

    if (error) {
      throw new Error(`Failed to update message ${recordId}: ${error.message}`)
    }
  }
}

// Batch Migration Service
class BatchMigrationService {
  constructor(
    private dbService: DatabaseService,
    private storageService: StorageService
  ) {}

  async migrateAllTables(): Promise<BatchMigrationResults> {
    console.log('🚀 [MIGRATE_BASE64_BATCH] Starting batch migration for all tables')

    const results: BatchMigrationResults = {
      totalProcessed: 0,
      totalErrors: 0,
      tableResults: {}
    }

    for (const tableName of CONVERSATION_TABLES) {
      const tableResult = await this.migrateTable(tableName)
      results.tableResults[tableName] = tableResult
      results.totalProcessed += tableResult.processed
      results.totalErrors += tableResult.errors

      console.log(`📊 [MIGRATE_BASE64_BATCH] Table ${tableName} completed: ${tableResult.processed} processed, ${tableResult.errors} errors`)
    }

    console.log(`🎉 [MIGRATE_BASE64_BATCH] Migration completed: ${results.totalProcessed} total processed, ${results.totalErrors} total errors`)
    return results
  }

  private async migrateTable(tableName: string): Promise<TableResult> {
    console.log(`🔄 [MIGRATE_BASE64_BATCH] Processing table: ${tableName}`)
    
    let tableProcessed = 0
    let tableErrors = 0
    let hasMore = true

    while (hasMore) {
      try {
        const messages = await this.dbService.getBase64Messages(tableName, BATCH_SIZE)

        if (messages.length === 0) {
          console.log(`✅ [MIGRATE_BASE64_BATCH] No more base64 messages in ${tableName}`)
          hasMore = false
          break
        }

        // Process each message in the batch
        for (const message of messages) {
          if (this.isValidBase64Message(message)) {
            try {
              await this.migrateMessage(tableName, message)
              tableProcessed++
              console.log(`✅ [MIGRATE_BASE64_BATCH] Migrated message ${message.id} in ${tableName}`)
            } catch (error) {
              console.error(`❌ [MIGRATE_BASE64_BATCH] Error processing message ${message.id}:`, error)
              tableErrors++
            }

            // Delay between messages to prevent rate limiting
            await this.delay(MESSAGE_DELAY)
          }
        }

        // If we got fewer messages than batch size, we're done
        if (messages.length < BATCH_SIZE) {
          hasMore = false
        }

        // Delay between batches
        await this.delay(BATCH_DELAY)

      } catch (error) {
        console.error(`❌ [MIGRATE_BASE64_BATCH] Batch error for ${tableName}:`, error)
        tableErrors++
        break
      }
    }

    return { processed: tableProcessed, errors: tableErrors }
  }

  private async migrateMessage(tableName: string, message: MessageRecord): Promise<void> {
    // Upload base64 to storage
    const uploadResult = await this.storageService.uploadBase64(message.media_base64)
    
    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(`Upload failed: ${uploadResult.error}`)
    }

    // Update database record
    const mimeType = MediaTypeUtils.detectMimeType(message.media_base64)
    const placeholderMessage = MediaTypeUtils.getPlaceholder(mimeType)
    
    await this.dbService.updateMediaUrl(
      tableName, 
      message.id, 
      uploadResult.url, 
      placeholderMessage
    )
  }

  private isValidBase64Message(message: MessageRecord): boolean {
    return message.media_base64 && message.media_base64.startsWith('data:')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Main Handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize services
    const dbService = new DatabaseService(supabase)
    const storageService = new StorageService(supabase)
    const migrationService = new BatchMigrationService(dbService, storageService)

    // Execute batch migration
    const results = await migrationService.migrateAllTables()

    return createSuccessResponse({
      ...results,
      message: `Migration completed: ${results.totalProcessed} processed, ${results.totalErrors} errors`
    })

  } catch (error) {
    console.error('❌ [MIGRATE_BASE64_BATCH] Function error:', error)
    return createErrorResponse(
      'Migration failed',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
})

