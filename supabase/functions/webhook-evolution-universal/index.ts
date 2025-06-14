
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento completo de instâncias para tabelas
const INSTANCE_TABLE_MAPPING = {
  'yelena': 'yelena_ai_conversas',
  'yelena-ai': 'yelena_ai_conversas',
  'andressa': 'gerente_externo_conversas',
  'glamour': 'gerente_lojas_conversas',
  'gustavo': 'america_dourada_conversas',
  'canarana': 'canarana_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  'souto-soares': 'souto_soares_conversas'
};

// Configuração das colunas por tabela
const TABLE_CONFIG = {
  'yelena_ai_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: false,
    tipoRemetenteIA: 'Yelena-ai'
  },
  'gerente_externo_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true,
    tipoRemetenteIA: 'USUARIO_INTERNO'
  },
  'gerente_lojas_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true,
    tipoRemetenteIA: 'USUARIO_INTERNO'
  },
  'america_dourada_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true,
    tipoRemetenteIA: 'USUARIO_INTERNO'
  },
  'canarana_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true,
    tipoRemetenteIA: 'USUARIO_INTERNO'
  },
  'joao_dourado_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true,
    tipoRemetenteIA: 'USUARIO_INTERNO'
  },
  'souto_soares_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true,
    tipoRemetenteIA: 'USUARIO_INTERNO'
  }
};

// Funções auxiliares para extrair dados da mensagem
function extractPhoneAndName(sessionId: string) {
  if (!sessionId) return { phone: '', name: 'Cliente' };
  
  // Formato: TELEFONE-NOME ou apenas número
  const parts = sessionId.split('-');
  if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
    return { 
      phone: parts[0], 
      name: parts.slice(1).join('-') || 'Cliente' 
    };
  }
  
  const phoneMatch = sessionId.match(/(\d{10,15})/);
  return { 
    phone: phoneMatch ? phoneMatch[1] : sessionId, 
    name: 'Cliente' 
  };
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
    return { 
      type: 'image', 
      mediaUrl: messageData.message.imageMessage.url 
    };
  } else if (messageData.message?.audioMessage) {
    return { 
      type: 'audio', 
      mediaUrl: messageData.message.audioMessage.url 
    };
  } else if (messageData.message?.videoMessage) {
    return { 
      type: 'video', 
      mediaUrl: messageData.message.videoMessage.url 
    };
  } else if (messageData.message?.documentMessage) {
    return { 
      type: 'document', 
      mediaUrl: messageData.message.documentMessage.url 
    };
  }
  return { type: 'text' };
}

function normalizeInstanceName(instance: string): string {
  return instance.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
}

function getTableForInstance(instance: string): string | null {
  const normalized = normalizeInstanceName(instance);
  
  // Correspondência exata
  if (INSTANCE_TABLE_MAPPING[normalized]) {
    return INSTANCE_TABLE_MAPPING[normalized];
  }
  
  // Correspondência parcial
  for (const [key, table] of Object.entries(INSTANCE_TABLE_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return table;
    }
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log(`🎯 [WEBHOOK_EVOLUTION] Received webhook:`, JSON.stringify(webhookData, null, 2));

    // Extrair informações do webhook
    const { event, instance, data } = webhookData;
    
    if (!event || !instance) {
      console.error(`❌ [WEBHOOK_EVOLUTION] Missing required fields: event=${event}, instance=${instance}`);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event or instance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [WEBHOOK_EVOLUTION] Event: ${event}, Instance: ${instance}`);

    // Mapear instância para tabela
    const tableName = getTableForInstance(instance);
    if (!tableName) {
      console.warn(`⚠️ [WEBHOOK_EVOLUTION] Unknown instance: ${instance} - ignoring`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Instance ${instance} not mapped - ignored`,
          instance 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [WEBHOOK_EVOLUTION] Instance: ${instance} -> Table: ${tableName}`);

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'messages.upsert':
      case 'MESSAGES_UPSERT':
        if (!data) {
          console.error(`❌ [WEBHOOK_EVOLUTION] No message data received`);
          return new Response(
            JSON.stringify({ error: 'No message data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return await processMessage(supabase, data, tableName, instance);

      case 'connection.update':
      case 'CONNECTION_UPDATE':
        console.log(`🔗 [WEBHOOK_EVOLUTION] Connection update for ${instance}:`, data);
        return new Response(
          JSON.stringify({ success: true, message: 'Connection update processed', instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'qrcode.updated':
      case 'QRCODE_UPDATED':
        console.log(`📱 [WEBHOOK_EVOLUTION] QR Code update for ${instance}:`, data);
        return new Response(
          JSON.stringify({ success: true, message: 'QR Code update processed', instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'contacts.upsert':
      case 'CONTACTS_UPSERT':
        console.log(`👤 [WEBHOOK_EVOLUTION] Contacts update for ${instance}:`, data);
        return new Response(
          JSON.stringify({ success: true, message: 'Contacts update processed', instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'chats.upsert':
      case 'CHATS_UPSERT':
        console.log(`💬 [WEBHOOK_EVOLUTION] Chats update for ${instance}:`, data);
        return new Response(
          JSON.stringify({ success: true, message: 'Chats update processed', instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        console.log(`ℹ️ [WEBHOOK_EVOLUTION] Unhandled event ${event} from instance ${instance}`);
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

async function processMessage(supabase: any, messageData: any, tableName: string, instance: string) {
  try {
    console.log(`💬 [WEBHOOK_EVOLUTION] Processing message for ${instance} -> ${tableName}`);

    // Extrair sessionId
    const sessionId = messageData.key?.remoteJid || '';
    if (!sessionId) {
      console.error(`❌ [WEBHOOK_EVOLUTION] No session ID found in message`);
      return new Response(
        JSON.stringify({ error: 'No session ID in message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair telefone e nome do session_id
    const { phone, name } = extractPhoneAndName(sessionId);

    // Extrair conteúdo da mensagem
    const messageContent = getMessageContent(messageData);

    // Determinar tipo de remetente
    const tableConfig = TABLE_CONFIG[tableName];
    if (!tableConfig) {
      console.error(`❌ [WEBHOOK_EVOLUTION] No configuration for table: ${tableName}`);
      return new Response(
        JSON.stringify({ error: `No configuration for table: ${tableName}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tipoRemetente = 'CONTATO_EXTERNO';
    if (messageData.key?.fromMe) {
      tipoRemetente = tableConfig.tipoRemetenteIA;
    }

    // Determinar tipo de mensagem e mídia
    const { type: mensagemType, mediaUrl } = getMessageType(messageData);

    // Preparar dados para inserção
    const insertData: any = {
      session_id: sessionId,
      message: messageContent,
      read_at: new Date().toISOString(),
      mensagemtype: mensagemType,
      tipo_remetente: tipoRemetente,
    };

    // Adicionar nome do contato
    insertData[tableConfig.contactNameField] = name;

    // Adicionar mídia se existir
    if (mediaUrl) {
      insertData.media_base64 = mediaUrl;
    }

    // Adicionar is_read se a tabela suportar
    if (tableConfig.hasIsRead) {
      insertData.is_read = false;
    }

    console.log(`💾 [WEBHOOK_EVOLUTION] Saving to ${tableName}:`, {
      session_id: insertData.session_id,
      contactName: insertData[tableConfig.contactNameField],
      messageType: insertData.mensagemtype,
      hasMedia: !!insertData.media_base64,
      tipoRemetente: insertData.tipo_remetente,
      hasIsRead: tableConfig.hasIsRead
    });

    // Inserir no Supabase
    const { data: insertResult, error } = await supabase
      .from(tableName)
      .insert([insertData])
      .select();

    if (error) {
      console.error(`❌ [WEBHOOK_EVOLUTION] Database error:`, {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        tableName
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          details: error.message,
          code: error.code,
          tableName
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [WEBHOOK_EVOLUTION] Message saved successfully:`, {
      tableName,
      messageId: insertResult?.[0]?.id,
      sessionId: insertData.session_id,
      contactName: insertData[tableConfig.contactNameField]
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        tableName,
        messageId: insertResult?.[0]?.id,
        instance 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [WEBHOOK_EVOLUTION] Error processing message:`, {
      error: error.message || 'Unknown error',
      stack: error.stack,
      tableName
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Message processing failed',
        details: error.message || 'Unknown error',
        tableName 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
