
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de instâncias para canais e tabelas
const INSTANCE_MAPPING = {
  'yelena': 'yelena_ai_conversas',
  'andressa': 'gerente_externo_conversas',
  'glamour': 'gerente_lojas_conversas',
  'gustavo': 'america_dourada_conversas',
  'canarana': 'canarana_conversas',
  'joao-dourado': 'joao_dourado_conversas',
  'souto-soares': 'souto_soares_conversas'
};

// Configuração das colunas por tabela
const TABLE_COLUMNS = {
  'yelena_ai_conversas': {
    contactNameField: 'Nome_do_contato',
    hasIsRead: false
  },
  'gerente_externo_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true
  },
  'gerente_lojas_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true
  },
  'america_dourada_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true
  },
  'canarana_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true
  },
  'joao_dourado_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true
  },
  'souto_soares_conversas': {
    contactNameField: 'nome_do_contato',
    hasIsRead: true
  }
};

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
    console.log(`🎯 [WEBHOOK_UNIVERSAL] Received webhook:`, JSON.stringify(webhookData, null, 2));

    // Extrair informações do webhook
    const { event, instance, data } = webhookData;
    
    if (!event || !instance || !data) {
      console.error(`❌ [WEBHOOK_UNIVERSAL] Missing required fields: event=${event}, instance=${instance}, data=${!!data}`);
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapear instância para tabela
    const tableName = INSTANCE_MAPPING[instance];
    if (!tableName) {
      console.error(`❌ [WEBHOOK_UNIVERSAL] Unknown instance: ${instance}`);
      return new Response(
        JSON.stringify({ error: `Unknown instance: ${instance}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [WEBHOOK_UNIVERSAL] Instance: ${instance} -> Table: ${tableName}`);

    // Processar apenas mensagens
    if (event === 'messages.upsert') {
      const messageData = data;
      console.log(`💬 [WEBHOOK_UNIVERSAL] Processing message from ${messageData.key?.remoteJid || 'unknown'}`);

      // Extrair informações da mensagem
      const sessionId = messageData.key?.remoteJid || '';
      const messageContent = messageData.message?.conversation || 
                           messageData.message?.extendedTextMessage?.text || 
                           messageData.message?.imageMessage?.caption ||
                           messageData.message?.audioMessage?.caption ||
                           messageData.message?.videoMessage?.caption ||
                           messageData.message?.documentMessage?.caption ||
                           '[Mídia]';

      // Determinar tipo de remetente
      let tipoRemetente = 'CONTATO_EXTERNO';
      if (messageData.key?.fromMe) {
        tipoRemetente = instance === 'yelena' ? 'Yelena-ai' : 'USUARIO_INTERNO';
      }

      // Determinar tipo de mensagem
      let mensagemType = 'text';
      let mediaBase64 = null;

      if (messageData.message?.imageMessage) {
        mensagemType = 'image';
        if (messageData.message.imageMessage.url) {
          mediaBase64 = messageData.message.imageMessage.url;
        }
      } else if (messageData.message?.audioMessage) {
        mensagemType = 'audio';
        if (messageData.message.audioMessage.url) {
          mediaBase64 = messageData.message.audioMessage.url;
        }
      } else if (messageData.message?.videoMessage) {
        mensagemType = 'video';
        if (messageData.message.videoMessage.url) {
          mediaBase64 = messageData.message.videoMessage.url;
        }
      } else if (messageData.message?.documentMessage) {
        mensagemType = 'document';
        if (messageData.message.documentMessage.url) {
          mediaBase64 = messageData.message.documentMessage.url;
        }
      }

      // Extrair nome do contato do session_id
      const phoneNumber = sessionId.replace('@s.whatsapp.net', '').replace('@c.us', '');
      const contactName = phoneNumber;

      // Configuração da tabela
      const tableConfig = TABLE_COLUMNS[tableName];
      if (!tableConfig) {
        console.error(`❌ [WEBHOOK_UNIVERSAL] No configuration for table: ${tableName}`);
        return new Response(
          JSON.stringify({ error: `No configuration for table: ${tableName}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Preparar dados para inserção
      const insertData: any = {
        session_id: sessionId,
        message: messageContent,
        read_at: new Date().toISOString(),
        mensagemtype: mensagemType,
        tipo_remetente: tipoRemetente
      };

      // Adicionar nome do contato usando o campo correto
      insertData[tableConfig.contactNameField] = contactName;

      // Adicionar media_base64 se existir
      if (mediaBase64) {
        insertData.media_base64 = mediaBase64;
      }

      // Adicionar is_read se a tabela suportar
      if (tableConfig.hasIsRead) {
        insertData.is_read = false;
      }

      console.log(`💾 [WEBHOOK_UNIVERSAL] Saving to ${tableName}:`, {
        session_id: insertData.session_id,
        contactNameField: tableConfig.contactNameField,
        contactName: insertData[tableConfig.contactNameField],
        messageType: insertData.mensagemtype,
        hasMedia: !!insertData.media_base64,
        tipoRemetente: insertData.tipo_remetente
      });

      // Inserir no Supabase
      const { data: insertResult, error } = await supabase
        .from(tableName)
        .insert([insertData])
        .select();

      if (error) {
        console.error(`❌ [WEBHOOK_UNIVERSAL] Error saving message:`, {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          tableName,
          insertData
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'Database error', 
            details: error.message,
            tableName,
            contactNameField: tableConfig.contactNameField 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ [WEBHOOK_UNIVERSAL] Message saved successfully:`, {
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
    }

    // Para outros tipos de eventos, apenas log
    console.log(`ℹ️ [WEBHOOK_UNIVERSAL] Event ${event} from instance ${instance} - not processed`);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Event received but not processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [WEBHOOK_UNIVERSAL] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
