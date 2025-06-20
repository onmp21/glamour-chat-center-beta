import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_TABLES = [
  'yelena_ai_conversas',
  'canarana_conversas',
  'souto_soares_conversas',
  'joao_dourado_conversas',
  'america_dourada_conversas',
  'gerente_lojas_conversas',
  'gerente_externo_conversas'
]

const DEFAULT_BATCH_SIZE = 5
const PROCESSING_DELAY = 200 // ms
const STORAGE_BUCKET = 'media-files'

// Types
interface MigrationRequest {
  tables?: string[]
  batchSize?: number
}

interface MigrationResult {
  table: string
  status: 'completed' | 'error'
  processed: number
  total?: number
  error?: string
}

interface MessageRecord {
  id: string
  media_base64: string
}

// Utility Functions
function createErrorResponse(message: string, status: number = 500, details?: string) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message, 
      details 
    }),
    { 
      status, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
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
      status: 200, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  )
}

// MIME Type Detection
class MimeTypeDetector {
  private static readonly MIME_SIGNATURES: Record<string, string> = {
    '/9j/': 'image/jpeg',
    'iVBORw': 'image/png',
    'R0lGO': 'image/gif',
    'UklGR': 'image/webp',
    'SUQz': 'audio/mpeg',
    '//uQ': 'audio/mpeg',
    'T2dn': 'audio/ogg',
    'AAAAGG': 'video/mp4'
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

  static detect(base64Content: string): string {
    // Check for data URL format
    if (base64Content.includes('data:')) {
      const match = base64Content.match(/data:([^;]+)/)
      if (match) return match[1]
    }

    // Clean base64 content
    const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '')
    
    // Check signatures
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
}

// Base64 Converter
class Base64Converter {
  static toUint8Array(base64Content: string): Uint8Array {
    const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '')
    const binaryString = atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    return bytes
  }

  static generateFileName(messageId: string, mimeType: string): string {
    const extension = MimeTypeDetector.getExtension(mimeType)
    const timestamp = Date.now()
    return `migrated_${messageId}_${timestamp}${extension}`
  }
}

// Database Operations
class DatabaseOperations {
  constructor(private supabase: any) {}

  async getBase64Messages(tableName: string, batchSize: number): Promise<MessageRecord[] | null> {
    const { data: messages, error } = await this.supabase.rpc('get_base64_messages', {
      table_name: tableName,
      batch_size: batchSize
    })

    if (error) {
      console.error(`❌ [MIGRATE_BASE64] Error fetching from ${tableName}:`, error)
      throw new Error(`Failed to fetch messages from ${tableName}: ${error.message}`)
    }

    return messages
  }

  async updateMediaUrl(tableName: string, recordId: string, mediaUrl: string, placeholderMessage: string): Promise<void> {
    const { error } = await this.supabase.rpc('update_media_url', {
      table_name: tableName,
      record_id: recordId,
      media_url: mediaUrl,
      placeholder_message: placeholderMessage
    })

    if (error) {
      console.error(`❌ [MIGRATE_BASE64] Update error for message ${recordId}:`, error)
      throw new Error(`Failed to update message ${recordId}: ${error.message}`)
    }
  }
}

// Storage Operations
class StorageOperations {
  constructor(private supabase: any) {}

  async uploadFile(fileName: string, fileData: Uint8Array, mimeType: string): Promise<string> {
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileData, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      console.error(`❌ [MIGRATE_BASE64] Upload error for file ${fileName}:`, uploadError)
      throw new Error(`Failed to upload file ${fileName}: ${uploadError.message}`)
    }

    // Generate public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uploadData.path)

    return publicUrl
  }
}

// Migration Service
class MigrationService {
  constructor(
    private dbOps: DatabaseOperations,
    private storageOps: StorageOperations
  ) {}

  async migrateTable(tableName: string, batchSize: number): Promise<MigrationResult> {
    console.log(`🔄 [MIGRATE_BASE64] Processing table: ${tableName}`)

    try {
      const messages = await this.dbOps.getBase64Messages(tableName, batchSize)

      if (!messages || messages.length === 0) {
        console.log(`✅ [MIGRATE_BASE64] No base64 messages in ${tableName}`)
        return { table: tableName, status: 'completed', processed: 0 }
      }

      let processedCount = 0

      for (const message of messages) {
        try {
          await this.migrateMessage(tableName, message)
          processedCount++
          console.log(`✅ [MIGRATE_BASE64] Migrated message ${message.id} in ${tableName}`)

          // Add delay to prevent rate limiting
          await this.delay(PROCESSING_DELAY)

        } catch (error) {
          console.error(`❌ [MIGRATE_BASE64] Error processing message ${message.id}:`, error)
          // Continue with next message instead of failing the entire batch
        }
      }

      console.log(`✅ [MIGRATE_BASE64] Completed ${tableName}: ${processedCount}/${messages.length} processed`)

      return {
        table: tableName,
        status: 'completed',
        processed: processedCount,
        total: messages.length
      }

    } catch (error) {
      console.error(`❌ [MIGRATE_BASE64] Error processing table ${tableName}:`, error)
      return {
        table: tableName,
        status: 'error',
        error: error.message,
        processed: 0
      }
    }
  }

  private async migrateMessage(tableName: string, message: MessageRecord): Promise<void> {
    // Detect MIME type
    const mimeType = MimeTypeDetector.detect(message.media_base64)
    
    // Convert base64 to binary
    const fileData = Base64Converter.toUint8Array(message.media_base64)
    
    // Generate file name
    const fileName = Base64Converter.generateFileName(message.id, mimeType)
    
    // Upload to storage
    const publicUrl = await this.storageOps.uploadFile(fileName, fileData, mimeType)
    
    // Update database record
    const placeholderMessage = MimeTypeDetector.getPlaceholder(mimeType)
    await this.dbOps.updateMediaUrl(tableName, message.id, publicUrl, placeholderMessage)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Request Validator
class RequestValidator {
  static validate(req: Request): void {
    if (req.method === 'OPTIONS') {
      throw new Response(null, { headers: CORS_HEADERS })
    }

    if (req.method !== 'POST') {
      throw createErrorResponse('Method not allowed', 405)
    }
  }

  static parseRequest(requestData: any): { tables: string[], batchSize: number } {
    const tables = Array.isArray(requestData.tables) ? requestData.tables : DEFAULT_TABLES
    const batchSize = typeof requestData.batchSize === 'number' ? requestData.batchSize : DEFAULT_BATCH_SIZE

    return { tables, batchSize }
  }
}

// Main Handler
serve(async (req) => {
  try {
    RequestValidator.validate(req)
  } catch (response) {
    if (response instanceof Response) {
      return response
    }
    throw response
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request
    const requestData: MigrationRequest = await req.json()
    const { tables, batchSize } = RequestValidator.parseRequest(requestData)

    console.log(`🔄 [MIGRATE_BASE64] Starting migration for tables: ${tables.join(', ')}`)

    // Initialize services
    const dbOps = new DatabaseOperations(supabase)
    const storageOps = new StorageOperations(supabase)
    const migrationService = new MigrationService(dbOps, storageOps)

    // Process all tables
    const results: MigrationResult[] = []
    for (const tableName of tables) {
      const result = await migrationService.migrateTable(tableName, batchSize)
      results.push(result)
    }

    return createSuccessResponse({
      message: 'Migration completed',
      results
    })

  } catch (error) {
    console.error('❌ [MIGRATE_BASE64] Migration failed:', error)
    return createErrorResponse(
      'Migration failed',
      500,
      error.message
    )
  }
})

