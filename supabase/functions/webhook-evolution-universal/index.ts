
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Helper para detectar se string é base64 dataurl
function isDataUrl(str: string) {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
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

/**
 * Detecta o mime type por assinatura do base64
 */
function detectMimeTypeFromBase64(base64: string): string {
  if (base64.startsWith('iVBORw')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('R0lGO')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('SUQz') || base64.startsWith('//uQ')) return 'audio/mpeg';
  if (base64.startsWith('T2dn')) return 'audio/ogg';
  if (base64.startsWith('AAAAGG') || base64.startsWith('AAAAFG')) return 'video/mp4';
  return 'application/octet-stream';
}

/**
 * Faz upload do base64 para storage e retorna URL pública
 */
async function uploadBase64ToStorage(supabase: any, base64Content: string, filePrefix: string = "media_"): Promise<string | null> {
  try {
    const [, base64Body] = base64Content.split(',');
    let mimeType = 'application/octet-stream';

    // Detecta MIME type pelo header da dataurl ou pela assinatura
    const match = base64Content.match(/data:([^;]+);base64,/);
    if (match && match[1]) {
      mimeType = match[1];
    } else if (base64Body) {
      mimeType = detectMimeTypeFromBase64(base64Body);
    }

    // Gera nome do arquivo com extensão apropriada
    const extension = getExtensionFromMimeType(mimeType);
    const fileName = `${filePrefix}${Date.now()}_${Math.floor(Math.random()*1e7)}${extension}`;

    // Converte base64 para Uint8Array
    const binary = atob(base64Body);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }

    // Upload para o bucket 'media-files'
    const { data, error } = await supabase.storage
      .from('media-files')
      .upload(fileName, array, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('[WEBHOOK_EVOLUTION] Erro ao fazer upload:', error);
      return null;
    }

    // Montar URL pública
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/media-files/${fileName}`;
    return publicUrl;
  } catch (err) {
    console.error('[WEBHOOK_EVOLUTION] Erro geral no upload:', err);
    return null;
  }
}

function extractPhoneAndName(sessionId: string) {
  if (!sessionId) return { phone: '', name: 'Cliente' };
  const parts = sessionId.split('-');
  if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
    return { phone: parts[0], name: parts.slice(1).join('-') || 'Cliente' };
  }
  const phoneMatch = sessionId.match(/(\d{10,15})/);
  return { phone: phoneMatch ? phoneMatch[1] : sessionId, name: 'Cliente' };
}

function getMessageContent(messageData: any): string {
  return messageData.message?.conversation ||
    messageData.message?.extendedTextMessage?.text ||
    messageData.message?.imageMessage?.caption ||
    messageData.message?.audioMessage?.caption ||
    messageData.message?.videoMessage?.caption ||
    messageData.message?.documentMessage?.caption ||
    '[Mídia]';
}

function getMessageType(messageData: any): { type: string; mediaUrl?: string } {
  if (messageData.message?.imageMessage) {
    return { type: 'image', mediaUrl: messageData.message.imageMessage.url };
  } else if (messageData.message?.audioMessage) {
    return { type: 'audio', mediaUrl: messageData.message.audioMessage.url };
  } else if (messageData.message?.videoMessage) {
    return { type: 'video', mediaUrl: messageData.message.videoMessage.url };
  } else if (messageData.message?.documentMessage) {
    return { type: 'document', mediaUrl: messageData.message.documentMessage.url };
  }
  return { type: 'text' };
}

/*
 * Obtém o canal vinculado à instância pelo banco (mapeamento dinâmico)
 * Depois retorna o nome da tabela correta para esse canal
 */
async function getTableNameForInstance(supabase: any, instanceName:string): Promise<{tableName: string|null, channelId: string|null, debug?:any}> {
  // 1. Busca api_instance pelo instance_name
  const { data: apiInstance, error: errorApi } = await supabase
    .from('api_instances')
    .select('id, instance_name')
    .ilike('instance_name', instanceName)
    .single();

  if (errorApi) {
    console.error('[WEBHOOK_EVOLUTION] Erro ao buscar api_instance:', errorApi);
    return { tableName: null, channelId: null };
  }
  if (!apiInstance?.id) {
    console.warn('[WEBHOOK_EVOLUTION] Nenhum api_instance encontrada para:', instanceName);
    return { tableName: null, channelId: null };
  }

  // 2. Busca mapeamento para esse api_instance em channel_api_mappings
  const { data: mapping, error: errorMap } = await supabase
    .from('channel_api_mappings')
    .select('channel_id')
    .eq('api_instance_id', apiInstance.id)
    .limit(1)
    .single();

  if (errorMap) {
    console.error('[WEBHOOK_EVOLUTION] Erro ao buscar channel_api_mapping:', errorMap);
    return { tableName: null, channelId: null };
  }
  if (!mapping?.channel_id) {
    console.warn('[WEBHOOK_EVOLUTION] Nenhum canal vinculado para:', instanceName);
    return { tableName: null, channelId: null };
  }

  // 3. Retorna o nome da tabela correta para o canal usando util
  const channelMapping: Record<string, string> = {
    'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas', // Yelena AI
    '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
    'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
    '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
    '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
    'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
    'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    // Adicione outros conforme necessário
  };

  const tableName = channelMapping[mapping.channel_id] || null;

  return { tableName, channelId: mapping.channel_id, debug: {apiInstance, mapping} };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const webhookData = await req.json();
    console.log(`🎯 [WEBHOOK_EVOLUTION] Received webhook:`, JSON.stringify(webhookData, null, 2));

    const { event, instance, data } = webhookData;
    if (!event || !instance) {
      return new Response(JSON.stringify({ error: 'Missing required fields: event or instance' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Buscar tabela correta via mapeamento DBC
    const { tableName, channelId } = await getTableNameForInstance(supabase, instance);

    if (!tableName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Não foi possível determinar a tabela para instância/canal: ${instance}`,
          debug: { instance, channelId }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar eventos de mensagem
    switch (event.toLowerCase()) {
      case 'messages.upsert':
      case 'messages_upsert':
      case 'messagesupsert':
        if (!data) {
          return new Response(JSON.stringify({ error: 'No message data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return await processMessage(supabase, data, tableName, instance);

      default:
        // Outros eventos - sem operação
        return new Response(
          JSON.stringify({ success: true, message: `Event ${event} received but not processed`, instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ [WEBHOOK_EVOLUTION] Unexpected error:', {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      name: error.name || 'Unknown error type'
    });
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função processa mensagem individual e faz upload automático de mídia base64 para storage
async function processMessage(supabase: any, messageData: any, tableName: string, instance: string) {
  try {
    // Extrair sessionId, contato etc
    const sessionId = messageData.key?.remoteJid || '';
    const { phone, name } = extractPhoneAndName(sessionId);
    const messageContent = getMessageContent(messageData);
    let tipoRemetente = messageData.key?.fromMe
      ? 'USUARIO_INTERNO'
      : 'CONTATO_EXTERNO';

    const { type: mensagemType, mediaUrl } = getMessageType(messageData);

    // Se houver mídia em base64, upload e substitui
    let finalMediaUrl = null;

    if (mediaUrl) {
      if (isDataUrl(mediaUrl)) {
        finalMediaUrl = await uploadBase64ToStorage(supabase, mediaUrl);
      } else if (
        typeof mediaUrl === 'string' && 
        /^\s*[A-Za-z0-9+/]{100,}={0,2}\s*$/.test(mediaUrl) // base64 puro (sem header)
      ) {
        // Monte como dataurl e faça upload
        const mimeTypeGuess = detectMimeTypeFromBase64(mediaUrl.trim());
        const dataUrl = `data:${mimeTypeGuess};base64,${mediaUrl.trim()}`;
        finalMediaUrl = await uploadBase64ToStorage(supabase, dataUrl);
      } else {
        // Se já é URL externa, usar direto
        finalMediaUrl = mediaUrl;
      }
    }

    // Build dados para insert
    const insertData: any = {
      session_id: sessionId,
      message: messageContent,
      read_at: new Date().toISOString(),
      mensagemtype: mensagemType,
      tipo_remetente: tipoRemetente,
      nome_do_contato: name
    };

    if (finalMediaUrl) {
      insertData.media_base64 = finalMediaUrl;
      if (
        mensagemType === 'image'
      ) insertData.message = '[Imagem]';
      else if (mensagemType === 'audio') insertData.message = '[Áudio]';
      else if (mensagemType === 'video') insertData.message = '[Vídeo]';
      else if (mensagemType === 'document') insertData.message = '[Documento]';
      else insertData.message = '[Mídia]';
    }

    // Adicionar is_read se a tabela tiver
    const hasIsRead = ['canarana_conversas','gerente_lojas_conversas','gerente_externo_conversas','america_dourada_conversas','joao_dourado_conversas','souto_soares_conversas'].includes(tableName);
    if (hasIsRead) {
      insertData.is_read = false;
    }

    // Save no banco
    const { data: insertResult, error: insertError } = await supabase
      .from(tableName)
      .insert([insertData])
      .select();

    if (insertError) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          details: insertError.message,
          tableName
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        tableName,
        messageId: insertResult?.[0]?.id,
        storageUrl: finalMediaUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Message processing failed', details: error.message || 'Unknown error', tableName }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
