import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

function isDataUrl(str) {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
}

function extractPhoneAndName(sessionId) {
  if (!sessionId) return { phone: '', name: 'Cliente' };
  const parts = sessionId.split('-');
  if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
    return { phone: parts[0], name: parts.slice(1).join('-') || 'Cliente' };
  }
  const phoneMatch = sessionId.match(/(\d{10,15})/);
  return { phone: phoneMatch ? phoneMatch[1] : sessionId, name: 'Cliente' };
}

function getMessageContent(messageData) {
  return messageData.message?.conversation ||
    messageData.message?.extendedTextMessage?.text ||
    messageData.message?.imageMessage?.caption ||
    messageData.message?.audioMessage?.caption ||
    messageData.message?.videoMessage?.caption ||
    messageData.message?.documentMessage?.caption ||
    '[Mídia]';
}

function getMessageType(messageData) {
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

const TABLE_NAME = "canarana_conversas";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const webhookData = await req.json();
    const { event, instance, data } = webhookData;

    if (!event || !instance) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: event or instance'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (event.toLowerCase()) {
      case 'messages.upsert':
      case 'messages_upsert':
      case 'messagesupsert':
        if (!data) {
          return new Response(JSON.stringify({
            error: 'No message data'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await processMessage(supabase, data, TABLE_NAME, instance);

      default:
        return new Response(JSON.stringify({
          success: true,
          message: `Event ${event} received but not processed`,
          instance
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processMessage(supabase, messageData, tableName, instance) {
  try {
    const sessionId = messageData.key?.remoteJid || '';
    const { phone, name } = extractPhoneAndName(sessionId);
    const messageContent = getMessageContent(messageData);

    let tipoRemetente = messageData.key?.fromMe ? 'USUARIO_INTERNO' : 'CONTATO_EXTERNO';
    const { type: mensagemType, mediaUrl } = getMessageType(messageData);

    const insertData = {
      session_id: sessionId,
      message: messageContent,
      read_at: new Date().toISOString(),
      mensagemtype: mensagemType,
      tipo_remetente: tipoRemetente,
      nome_do_contato: name,
      is_read: false
    };

    if (mediaUrl && isDataUrl(mediaUrl)) {
      insertData.media_base64 = mediaUrl;
      if (mensagemType === 'image') insertData.message = '[Imagem]';
      else if (mensagemType === 'audio') insertData.message = '[Áudio]';
      else if (mensagemType === 'video') insertData.message = '[Vídeo]';
      else if (mensagemType === 'document') insertData.message = '[Documento]';
      else insertData.message = '[Mídia]';
    }

    const { data: insertResult, error: insertError } = await supabase
      .from(tableName)
      .insert([insertData])
      .select();

    if (insertError) {
      return new Response(JSON.stringify({
        error: 'Database error',
        details: insertError.message,
        tableName
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      tableName,
      messageId: insertResult?.[0]?.id,
      mediaUrl: (mediaUrl && isDataUrl(mediaUrl)) ? mediaUrl : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Message processing failed',
      details: error.message || 'Unknown error',
      tableName
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
