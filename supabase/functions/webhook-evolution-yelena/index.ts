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

function cleanPhoneFromSessionId(sessionId) {
  if (typeof sessionId !== 'string') return '';
  const match = sessionId.match(/(\d{10,15})/);
  return match ? match[1] : sessionId.replace(/@.*$/, '');
}

function extractPhoneAndName(messageData) {
  const sessionId = messageData?.key?.remoteJid || '';
  const phone = cleanPhoneFromSessionId(sessionId);

  let name = 'Cliente';

  // Corrigido: USUARIO_INTERNO (fromMe: true) usa agentName (se houver), senão 'Yelena' (mas NUNCA 'Cliente')
  if (typeof messageData?.pushName === 'string' && messageData.pushName.trim() && !messageData?.key?.fromMe) {
    name = messageData.pushName.trim();
  } else if (messageData?.key?.fromMe) {
    // Se fromMe=true, pega o agentName ou 'Yelena' default (NUNCA 'Cliente')
    name = typeof messageData.agentName === 'string'
        ? messageData.agentName.trim() || 'Yelena'
        : 'Yelena';
  }
  return { phone, name };
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

const TABLE_NAME = "yelena_ai_conversas";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const webhookData = await req.json();

    console.log("[Webhook-Yelena] Received webhook data:", JSON.stringify(webhookData, null, 2));
    const { event, instance, data } = webhookData;

    if (!event || !instance) {
      console.error("[Webhook-Yelena] Missing required fields: event or instance");
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
          console.error("[Webhook-Yelena] No message data received");
          return new Response(JSON.stringify({
            error: 'No message data'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await processMessage(supabase, data, TABLE_NAME, instance);

      default:
        console.warn(`[Webhook-Yelena] Event ${event} received but not processed`);
        return new Response(JSON.stringify({
          success: true,
          message: `Event ${event} received but not processed`,
          instance
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error("[Webhook-Yelena] Internal server error:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error && (error.message || error.toString())
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processMessage(supabase, messageData, tableName, instance) {
  try {
    console.log('[Webhook-Yelena] processMessage data:', JSON.stringify(messageData, null, 2));
    const { phone, name } = extractPhoneAndName(messageData);
    const sessionId = phone;
    const messageContent = getMessageContent(messageData);
    let tipoRemetente = messageData.key?.fromMe ? 'USUARIO_INTERNO' : 'CONTATO_EXTERNO';

    // NOVO uso: pega type/placeholder/url
    const { type: mensagemType, placeholder, mediaUrl } = getMediaSaveDetails(messageData);
    let realMessageContent = messageContent;
    let mediaBase64 = null;

    if (mediaUrl && isDataUrl(mediaUrl)) {
      mediaBase64 = mediaUrl;
      realMessageContent = placeholder || '[Mídia]';
    }

    const insertData = {
      session_id: sessionId,
      message: realMessageContent,
      read_at: new Date().toISOString(),
      mensagemtype: mensagemType,
      tipo_remetente: tipoRemetente,
      nome_do_contato: name,
      is_read: false,
      media_base64: mediaBase64
    };

    console.log("[Webhook-Yelena] Attempting to insert message into table:", tableName, "with payload:", JSON.stringify(insertData, null, 2));
    const { data: insertResult, error: insertError } = await supabase
      .from(tableName)
      .insert([insertData])
      .select();

    if (insertError) {
      console.error("[Webhook-Yelena] Database error on insert:", insertError.message, "Table:", tableName, "Insert data:", JSON.stringify(insertData, null, 2));
      return new Response(JSON.stringify({
        error: 'Database error',
        details: insertError.message,
        tableName,
        insertData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[Webhook-Yelena] Message successfully inserted! Result:", JSON.stringify(insertResult, null, 2));
    return new Response(JSON.stringify({
      success: true,
      tableName,
      messageId: insertResult?.[0]?.id,
      mediaUrl: mediaBase64
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[Webhook-Yelena] Message processing failed:", error, "Insert payload:", messageData);
    return new Response(JSON.stringify({
      error: 'Message processing failed',
      details: error && (error.message || error.toString()),
      tableName
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
