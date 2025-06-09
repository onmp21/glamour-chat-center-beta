import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { downloadMediaAsBase64, getMediaTypeFromMessage, getMediaUrlFromMessage, getMediaCaptionFromMessage } from '../_shared/mediaUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      url?: string;
      mimetype?: string;
    };
    documentMessage?: {
      caption?: string;
      fileName?: string;
      url?: string;
      mimetype?: string;
    };
    audioMessage?: {
      url?: string;
      mimetype?: string;
    };
    videoMessage?: {
      caption?: string;
      url?: string;
      mimetype?: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

interface WebhookPayload {
  event: string;
  instance: string;
  data: WhatsAppMessage;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: WebhookPayload = await req.json();
    
    console.log('📥 [WEBHOOK_AMERICA_DOURADA] Received webhook:', JSON.stringify(payload, null, 2));

    if (!payload.data || !payload.data.key || !payload.data.message) {
      console.log('❌ [WEBHOOK_AMERICA_DOURADA] Invalid message format');
      return new Response(
        JSON.stringify({ status: 'ignored', reason: 'invalid_format' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const message = payload.data;
    const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
    
    let messageContent = '';
    let messageType = 'text';
    
    // Processar tipos de mensagem com suporte a mídia
    if (message.message.conversation) {
      messageContent = message.message.conversation;
      messageType = 'text';
    } else if (message.message.extendedTextMessage?.text) {
      messageContent = message.message.extendedTextMessage.text;
      messageType = 'text';
    } else {
      // Detectar tipo de mídia
      messageType = getMediaTypeFromMessage(message.message);
      
      if (messageType !== 'text') {
        const mediaUrl = getMediaUrlFromMessage(message.message);
        
        if (mediaUrl) {
          console.log(`🎬 [WEBHOOK_AMERICA_DOURADA] Processing ${messageType} media from URL`);
          
          // Baixar e converter para base64 com formato data:mimetype;base64
          const base64Content = await downloadMediaAsBase64(mediaUrl);
          
          if (base64Content) {
            messageContent = base64Content;
            console.log(`✅ [WEBHOOK_AMERICA_DOURADA] Media converted to base64 successfully`);
          } else {
            messageContent = getMediaCaptionFromMessage(message.message, messageType);
            console.log(`⚠️ [WEBHOOK_AMERICA_DOURADA] Failed to download media, using caption/placeholder`);
          }
        } else {
          messageContent = getMediaCaptionFromMessage(message.message, messageType);
        }
      } else {
        messageContent = '[Mensagem não suportada]';
      }
    }

    let contactName: string | null;
    let tipoRemetente: string;
    
    if (message.key.fromMe) {
      contactName = null;
      tipoRemetente = 'USUARIO_INTERNO';
      console.log(`📤 [WEBHOOK_AMERICA_DOURADA] Processing outgoing message from América Dourada to ${phoneNumber}`);
    } else {
      contactName = message.pushName || phoneNumber;
      tipoRemetente = 'CONTATO_EXTERNO';
      console.log(`📥 [WEBHOOK_AMERICA_DOURADA] Processing incoming message from ${phoneNumber} (${contactName})`);
    }
    
    const sessionId = phoneNumber;
    const timestamp = new Date(message.messageTimestamp * 1000).toISOString();

    console.log(`💾 [WEBHOOK_AMERICA_DOURADA] Saving ${tipoRemetente} message type ${messageType}: ${messageType === 'text' ? messageContent.substring(0, 50) : '[MEDIA]'}...`);

    const { data, error } = await supabase
      .from('america_dourada_conversas')
      .insert({
        session_id: sessionId,
        message: messageContent,
        nome_do_contato: contactName,
        tipo_remetente: tipoRemetente,
        mensagemtype: messageType,
        read_at: timestamp
      });

    if (error) {
      console.error('❌ [WEBHOOK_AMERICA_DOURADA] Error saving message:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ [WEBHOOK_AMERICA_DOURADA] Message saved successfully');

    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Message processed',
        data: {
          phone: phoneNumber,
          contact: contactName,
          content_preview: messageType === 'text' ? messageContent.substring(0, 100) : `[${messageType.toUpperCase()}]`,
          type: messageType,
          sender_type: tipoRemetente,
          session_id: sessionId
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [WEBHOOK_AMERICA_DOURADA] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

