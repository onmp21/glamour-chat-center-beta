
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MigrationRequest {
  tables?: string[];
  batchSize?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: MigrationRequest = await req.json();
    const tablesToMigrate = requestData.tables || [
      'yelena_ai_conversas',
      'canarana_conversas', 
      'souto_soares_conversas',
      'joao_dourado_conversas',
      'america_dourada_conversas',
      'gerente_lojas_conversas',
      'gerente_externo_conversas'
    ];
    const batchSize = requestData.batchSize || 5;

    console.log(`🔄 [MIGRATE_BASE64_ENHANCED] Starting migration for tables: ${tablesToMigrate.join(', ')}`);

    const results = [];

    for (const tableName of tablesToMigrate) {
      console.log(`🔄 [MIGRATE_BASE64_ENHANCED] Processing table: ${tableName}`);

      // Buscar mensagens com base64
      const { data: messages, error: fetchError } = await supabase.rpc('get_base64_messages', {
        table_name: tableName,
        batch_size: batchSize
      });

      if (fetchError) {
        console.error(`❌ [MIGRATE_BASE64_ENHANCED] Error fetching from ${tableName}:`, fetchError);
        results.push({ table: tableName, status: 'error', error: fetchError.message, processed: 0 });
        continue;
      }

      if (!messages || messages.length === 0) {
        console.log(`✅ [MIGRATE_BASE64_ENHANCED] No base64 messages in ${tableName}`);
        results.push({ table: tableName, status: 'completed', processed: 0 });
        continue;
      }

      let processedCount = 0;

      for (const message of messages) {
        try {
          // Extrair base64 puro
          const base64Content = message.media_base64.replace(/^data:[^;]+;base64,/, '');
          
          // Detectar MIME type
          const mimeType = detectMimeType(message.media_base64);
          const extension = getExtensionFromMimeType(mimeType);
          
          // Gerar nome do arquivo
          const fileName = `migrated_${message.id}_${Date.now()}${extension}`;
          
          // Converter base64 para Uint8Array
          const binaryString = atob(base64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Upload para storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media-files')
            .upload(fileName, bytes, {
              contentType: mimeType,
              upsert: false
            });

          if (uploadError) {
            console.error(`❌ [MIGRATE_BASE64_ENHANCED] Upload error for message ${message.id}:`, uploadError);
            continue;
          }

          // Gerar URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('media-files')
            .getPublicUrl(uploadData.path);

          // Atualizar registro na tabela
          const { error: updateError } = await supabase.rpc('update_media_url', {
            table_name: tableName,
            record_id: message.id,
            media_url: publicUrl,
            placeholder_message: getPlaceholderMessage(mimeType)
          });

          if (updateError) {
            console.error(`❌ [MIGRATE_BASE64_ENHANCED] Update error for message ${message.id}:`, updateError);
            continue;
          }

          processedCount++;
          console.log(`✅ [MIGRATE_BASE64_ENHANCED] Migrated message ${message.id} in ${tableName}`);

          // Pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`❌ [MIGRATE_BASE64_ENHANCED] Error processing message ${message.id}:`, error);
        }
      }

      results.push({ 
        table: tableName, 
        status: 'completed', 
        processed: processedCount,
        total: messages.length 
      });

      console.log(`✅ [MIGRATE_BASE64_ENHANCED] Completed ${tableName}: ${processedCount}/${messages.length} processed`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migration completed',
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [MIGRATE_BASE64_ENHANCED] Migration failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Migration failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectMimeType(base64Content: string): string {
  if (base64Content.includes('data:')) {
    const match = base64Content.match(/data:([^;]+)/);
    if (match) return match[1];
  }

  const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '');
  
  if (cleanBase64.startsWith('/9j/')) return 'image/jpeg';
  if (cleanBase64.startsWith('iVBORw')) return 'image/png';
  if (cleanBase64.startsWith('R0lGO')) return 'image/gif';
  if (cleanBase64.startsWith('UklGR')) return 'image/webp';
  if (cleanBase64.startsWith('SUQz') || cleanBase64.startsWith('//uQ')) return 'audio/mpeg';
  if (cleanBase64.startsWith('T2dn')) return 'audio/ogg';
  if (cleanBase64.startsWith('AAAAGG')) return 'video/mp4';
  
  return 'application/octet-stream';
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
  };
  return extensions[mimeType] || '.bin';
}

function getPlaceholderMessage(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '[Imagem]';
  if (mimeType.startsWith('audio/')) return '[Áudio]';
  if (mimeType.startsWith('video/')) return '[Vídeo]';
  if (mimeType === 'application/pdf') return '[Documento PDF]';
  return '[Mídia]';
}
