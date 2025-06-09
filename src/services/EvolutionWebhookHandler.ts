import { supabase } from '@/integrations/supabase/client';

export interface WebhookMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: any;
    messageTimestamp: string;
    pushName?: string;
    messageType: string;
  };
}

export interface ProcessedMessage {
  sessionId: string;
  phoneNumber: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker';
  sender: 'customer' | 'agent';
  contactName?: string;
  mediaUrl?: string;
  fileName?: string;
  timestamp: Date;
}

export class EvolutionWebhookHandler {
  /**
   * Processar webhook recebido da Evolution API
   */
  static async processWebhook(webhookData: WebhookMessage): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [WEBHOOK_HANDLER] Processando webhook:', webhookData.event);
      
      // Verificar se é um evento de mensagem
      if (webhookData.event !== 'messages.upsert') {
        console.log('ℹ️ [WEBHOOK_HANDLER] Evento ignorado:', webhookData.event);
        return { success: true };
      }

      // Verificar se a mensagem não é nossa (fromMe = false)
      if (webhookData.data.key.fromMe) {
        console.log('ℹ️ [WEBHOOK_HANDLER] Mensagem própria ignorada');
        return { success: true };
      }

      // Processar a mensagem
      const processedMessage = this.extractMessageData(webhookData);
      
      if (!processedMessage) {
        console.log('⚠️ [WEBHOOK_HANDLER] Não foi possível processar a mensagem');
        return { success: true };
      }

      // Salvar mensagem no banco de dados
      await this.saveMessageToDatabase(processedMessage, webhookData.instance);

      console.log('✅ [WEBHOOK_HANDLER] Mensagem processada e salva com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [WEBHOOK_HANDLER] Erro ao processar webhook:', error);
      return { success: false, error: `${error}` };
    }
  }

  /**
   * Extrair dados da mensagem do webhook
   */
  private static extractMessageData(webhookData: WebhookMessage): ProcessedMessage | null {
    try {
      const { data } = webhookData;
      const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
      
      // Usar o número de telefone como session_id
      const sessionId = phoneNumber;
      
      let content = '';
      let messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' = 'text';
      let mediaUrl: string | undefined;
      let fileName: string | undefined;

      // Extrair conteúdo baseado no tipo de mensagem
      if (data.message.conversation) {
        content = data.message.conversation;
        messageType = 'text';
      } else if (data.message.extendedTextMessage) {
        content = data.message.extendedTextMessage.text;
        messageType = 'text';
      } else if (data.message.imageMessage) {
        content = data.message.imageMessage.caption || 'Imagem';
        messageType = 'image';
        mediaUrl = data.message.imageMessage.url;
        fileName = 'image.jpg';
      } else if (data.message.audioMessage) {
        content = 'Áudio';
        messageType = 'audio';
        mediaUrl = data.message.audioMessage.url;
        fileName = 'audio.ogg';
      } else if (data.message.videoMessage) {
        content = data.message.videoMessage.caption || 'Vídeo';
        messageType = 'video';
        mediaUrl = data.message.videoMessage.url;
        fileName = 'video.mp4';
      } else if (data.message.documentMessage) {
        content = data.message.documentMessage.title || 'Documento';
        messageType = 'document';
        mediaUrl = data.message.documentMessage.url;
        fileName = data.message.documentMessage.fileName || 'document.pdf';
      } else if (data.message.stickerMessage) {
        content = 'Figurinha';
        messageType = 'sticker';
        mediaUrl = data.message.stickerMessage.url;
        fileName = 'sticker.webp';
      } else {
        console.log('⚠️ [WEBHOOK_HANDLER] Tipo de mensagem não suportado:', Object.keys(data.message));
        return null;
      }

      return {
        sessionId,
        phoneNumber,
        content,
        messageType,
        sender: 'customer',
        contactName: data.pushName || phoneNumber,
        mediaUrl,
        fileName,
        timestamp: new Date(parseInt(data.messageTimestamp) * 1000)
      };
    } catch (error) {
      console.error('❌ [WEBHOOK_HANDLER] Erro ao extrair dados da mensagem:', error);
      return null;
    }
  }

  /**
   * Salvar mensagem no banco de dados
   */
  private static async saveMessageToDatabase(message: ProcessedMessage, instanceName: string): Promise<void> {
    try {
      // Determinar a tabela baseada na instância
      const tableName = this.getTableNameForInstance(instanceName);
      
      const messageRecord = {
        session_id: message.sessionId,
        message: message.content,
        tipo_remetente: message.sender,
        nome_do_contato: message.contactName || message.phoneNumber,
        mensagemtype: message.messageType,
        created_at: message.timestamp.toISOString(),
        media_url: message.mediaUrl,
        file_name: message.fileName
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert([messageRecord]);

      if (error) {
        console.error('❌ [WEBHOOK_HANDLER] Erro ao salvar mensagem no banco:', error);
        throw error;
      }

      console.log('✅ [WEBHOOK_HANDLER] Mensagem salva no banco de dados:', tableName);
    } catch (error) {
      console.error('❌ [WEBHOOK_HANDLER] Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  /**
   * Mapear instância para tabela do banco
   */
  private static getTableNameForInstance(instanceName: string): string {
    // Mapear nomes de instância para tabelas
    const instanceToTableMap: Record<string, string> = {
      'yelena-ai': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas'
    };
    
    return instanceToTableMap[instanceName] || 'yelena_ai_conversas';
  }

  /**
   * Criar endpoint para receber webhooks
   */
  static createWebhookEndpoint() {
    return {
      path: '/api/webhook/:instanceName',
      method: 'POST',
      handler: async (req: any, res: any) => {
        try {
          console.log('📥 [WEBHOOK_ENDPOINT] Webhook recebido:', req.params.instanceName);
          
          const webhookData: WebhookMessage = req.body;
          const result = await this.processWebhook(webhookData);
          
          if (result.success) {
            res.status(200).json({ success: true });
          } else {
            res.status(500).json({ success: false, error: result.error });
          }
        } catch (error) {
          console.error('❌ [WEBHOOK_ENDPOINT] Erro no endpoint:', error);
          res.status(500).json({ success: false, error: `${error}` });
        }
      }
    };
  }
}

/**
 * Função para configurar webhook automaticamente
 */
export async function setupWebhookForInstance(
  baseUrl: string,
  apiKey: string,
  instanceName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔗 [WEBHOOK_SETUP] Configurando webhook para instância:', instanceName);
    
    // URL do webhook (deve ser acessível publicamente)
    const webhookUrl = `${window.location.origin}/api/webhook/${instanceName}`;
    
    const response = await fetch(`${baseUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        webhook: webhookUrl,
        webhook_by_events: true,
        webhook_base64: true,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE'
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [WEBHOOK_SETUP] Webhook configurado:', result);
    
    return { success: true };
  } catch (error) {
    console.error('❌ [WEBHOOK_SETUP] Erro ao configurar webhook:', error);
    return { success: false, error: `${error}` };
  }
}

