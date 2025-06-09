
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// Mapeamento de instâncias para tabelas
const instanceToTableMap: Record<string, string> = {
  'yelena-ai': 'messages',
  'canarana': 'canarana_conversas',
  'souto-soares': 'souto_soares_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  'america-dourada': 'america_dourada_conversas',
  'gerente-lojas': 'gerente_lojas_conversas',
  'gerente-externo': 'gerente_externo_conversas'
};

// Mapeamento de instâncias para campo de contato
const instanceToContactFieldMap: Record<string, string> = {
  'yelena-ai': 'sender',
  'canarana': 'nome_do_contato',
  'souto-soares': 'nome_do_contato',
  'joao-dourado': 'nome_do_contato',
  'america-dourada': 'nome_do_contato',
  'gerente-lojas': 'nome_do_contato',
  'gerente-externo': 'Nome_do_contato'
};

// Mapeamento de instâncias para campo de mensagem
const instanceToMessageFieldMap: Record<string, string> = {
  'yelena-ai': 'content',
  'canarana': 'message',
  'souto-soares': 'message',
  'joao-dourado': 'message',
  'america-dourada': 'message',
  'gerente-lojas': 'message',
  'gerente-externo': 'message'
};

function getMediaTypeFromMessage(message: any): string {
  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'document';
  if (message.stickerMessage) return 'sticker';
  return 'text';
}

function getMediaCaptionFromMessage(message: any, messageType: string): string {
  switch (messageType) {
    case 'image':
      return message.imageMessage?.caption || '[Imagem]';
    case 'video':
      return message.videoMessage?.caption || '[Vídeo]';
    case 'document':
      return message.documentMessage?.caption || '[Documento]';
    case 'audio':
      return '[Áudio]';
    case 'sticker':
      return '[Figurinha]';
    default:
      return '[Mensagem não suportada]';
  }
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
    
    console.log('📥 [WEBHOOK_UNIVERSAL] Received webhook:', JSON.stringify(payload, null, 2));

    // Extrair nome da instância da URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const instanceName = pathParts[pathParts.length - 1] || payload.instance;

    console.log('🏷️ [WEBHOOK_UNIVERSAL] Instance name:', instanceName);

    if (!payload.data || !payload.data.key || !payload.data.message) {
      console.log('❌ [WEBHOOK_UNIVERSAL] Invalid message format');
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
    
    // Processar tipos de mensagem
    if (message.message.conversation) {
      messageContent = message.message.conversation;
      messageType = 'text';
    } else if (message.message.extendedTextMessage?.text) {
      messageContent = message.message.extendedTextMessage.text;
      messageType = 'text';
    } else {
      messageType = getMediaTypeFromMessage(message.message);
      messageContent = getMediaCaptionFromMessage(message.message, messageType);
    }

    let contactName: string | null;
    let tipoRemetente: string;
    
    if (message.key.fromMe) {
      contactName = null;
      tipoRemetente = instanceName === 'yelena-ai' ? 'Yelena-ai' : 'USUARIO_INTERNO';
      console.log(`📤 [WEBHOOK_UNIVERSAL] Processing outgoing message from ${instanceName} to ${phoneNumber}`);
    } else {
      contactName = message.pushName || phoneNumber;
      tipoRemetente = 'CONTATO_EXTERNO';
      console.log(`📥 [WEBHOOK_UNIVERSAL] Processing incoming message from ${phoneNumber} (${contactName})`);
    }
    
    const sessionId = phoneNumber;
    const timestamp = new Date(message.messageTimestamp * 1000).toISOString();

    console.log(`💾 [WEBHOOK_UNIVERSAL] Saving ${tipoRemetente} message type ${messageType}: ${messageType === 'text' ? messageContent.substring(0, 50) : '[MEDIA]'}...`);

    // Determinar tabela e campos baseados na instância
    const tableName = instanceToTableMap[instanceName] || 'messages';
    const contactField = instanceToContactFieldMap[instanceName] || 'sender';
    const messageField = instanceToMessageFieldMap[instanceName] || 'content';

    // Preparar dados da mensagem baseado na tabela
    let messageRecord: any = {
      session_id: sessionId,
      [messageField]: messageContent,
      tipo_remetente: tipoRemetente,
      mensagemtype: messageType
    };

    // Adicionar campo de contato específico por instância
    if (contactField === 'sender') {
      messageRecord.sender = contactName || instanceName;
      messageRecord.timestamp = timestamp;
    } else {
      messageRecord[contactField] = contactName;
      messageRecord.read_at = timestamp;
    }

    const { data, error } = await supabase
      .from(tableName as any)
      .insert([messageRecord]);

    if (error) {
      console.error('❌ [WEBHOOK_UNIVERSAL] Error saving message:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ [WEBHOOK_UNIVERSAL] Message saved successfully to', tableName);

    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Message processed',
        data: {
          instance: instanceName,
          table: tableName,
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
    console.error('❌ [WEBHOOK_UNIVERSAL] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
