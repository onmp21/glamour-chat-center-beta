import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
// Corrigir: importar o utilitário de mídia compartilhado
import { getMediaSaveDetails } from "../webhook-shared/mediaUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

function isDataUrl(str) {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
}

function isRawBase64(str: string) {
  // 80+ chars, sem 'data:', e só base64 chars
  if (typeof str !== 'string' || str.length < 32) return false;
  if (str.startsWith('data:')) return false;
  return /^[A-Za-z0-9+/=\s]+$/.test(str) && /[A-Za-z0-9+/]{20,}/.test(str);
}

function detectMimeTypeFromBase64(base64: string): string {
  if (base64.startsWith('iVBORw')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('R0lGO')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('Qk0') || base64.startsWith('Qk1')) return 'image/bmp';
  if (base64.startsWith('JVBERi')) return 'application/pdf';
  if (base64.startsWith('SUQz') || base64.startsWith('//uQ') || base64.startsWith('//sw')) return 'audio/mpeg';
  if (base64.startsWith('T2dn')) return 'audio/ogg';
  if (base64.startsWith('AAAAGG') || base64.startsWith('AAAAFG') || base64.startsWith('AAAAHG')) return 'video/mp4';
  return 'application/octet-stream';
}

function toDataUrlIfBase64(mediaUrl: string | undefined): string | undefined {
  if (!mediaUrl) return undefined;
  if (typeof mediaUrl !== 'string') return undefined;
  if (mediaUrl.startsWith('data:')) return mediaUrl;
  // Possível base64 puro
  if (isRawBase64(mediaUrl)) {
    const cleanBase64 = mediaUrl.replace(/\s/g, '');
    const mimeType = detectMimeTypeFromBase64(cleanBase64);
    const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
    return dataUrl;
  }
  return mediaUrl;
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

    const { event, instance, data } = webhookData;

    // 🌟 LOG every incoming event type and key details
    console.log(`[Webhook-Yelena][DEBUG] Received event: ${event} | Instance: ${instance} | Payload: ${JSON.stringify(webhookData, null, 2)}`);

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

      // 🌟 NEW: Add explicit debug logs for all message event types you do NOT process:
      case 'messages.update':
      case 'messages_update':
      case 'messagesupdate':
      case 'contacts.update':
      case 'contacts_update':
      case 'contactsupdate':
      case 'chats.update':
      case 'chats.upsert':
      case 'chats_update':
      case 'chatsupsert':
        console.warn(`[Webhook-Yelena][DEBUG] Event ${event} received, NOT processed. Payload:`, JSON.stringify(data, null, 2));
        // Optionally print message/media fields for further debugging
        try {
          if (Array.isArray(data)) {
            for (const item of data) {
              console.log(`[Webhook-Yelena][DEBUG] Item:`, JSON.stringify(item, null, 2));
              if (item?.message) {
                console.log(`[Webhook-Yelena][DEBUG] Item.message:`, JSON.stringify(item.message, null, 2));
              }
            }
          } else if (typeof data === 'object') {
            if (data?.message) {
              console.log(`[Webhook-Yelena][DEBUG] data.message:`, JSON.stringify(data.message, null, 2));
            } else {
              console.log(`[Webhook-Yelena][DEBUG] data (no .message):`, JSON.stringify(data, null, 2));
            }
          } else {
            console.log(`[Webhook-Yelena][DEBUG] data:`, data);
          }
        } catch (ddd) {
          console.log(`[Webhook-Yelena][DEBUG] Could not parse data for debug`);
        }
        return new Response(JSON.stringify({
          debug: true,
          success: true,
          message: `Event ${event} received but not processed (DEBUG logged)`,
          instance
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

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

    // Aqui, agora está usando a função importada corretamente
    const { type: mensagemType, placeholder, mediaUrl } = getMediaSaveDetails(messageData);

    let realMessageContent = messageContent;
    let mediaBase64 = null;

    // Sempre forçar para DataURL se base64 puro
    let checkedMediaUrl = toDataUrlIfBase64(mediaUrl);
    let usedMediaUrl = checkedMediaUrl && isDataUrl(checkedMediaUrl) ? checkedMediaUrl : null;

    if (usedMediaUrl) {
      mediaBase64 = usedMediaUrl;
      realMessageContent = placeholder || '[Mídia]';
      console.log('[Webhook-Yelena] Salva mídia como DataURL:', (mediaBase64+"").substring(0,60),'...');
    } else if (mediaUrl) {
      // fallback - mantém compatibilidade se for url http(s) ou vazio
      mediaBase64 = null;
      if (mensagemType === 'image') realMessageContent = '[Imagem]';
      else if (mensagemType === 'audio') realMessageContent = '[Áudio]';
      else if (mensagemType === 'video') realMessageContent = '[Vídeo]';
      else if (mensagemType === 'document') realMessageContent = '[Documento]';
      else realMessageContent = '[Mídia]';
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
