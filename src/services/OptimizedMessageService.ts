import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { supabase } from '@/integrations/supabase/client';
import { MediaStorageService } from './MediaStorageService';

export class OptimizedMessageService {
  private repositories: Map<string, MessageRepository> = new Map();
  private channelId: string;

  constructor(channelId?: string) {
    this.channelId = channelId || '';
  }

  private getRepository(channelId?: string): MessageRepository {
    const targetChannelId = channelId || this.channelId;
    if (!this.repositories.has(targetChannelId)) {
      const tableName = getTableNameForChannel(targetChannelId);
      this.repositories.set(targetChannelId, new MessageRepository(tableName));
    }
    return this.repositories.get(targetChannelId)!;
  }

  async getMessagesByConversation(sessionId: string, limit = 50): Promise<{ data: RawMessage[] }> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      console.log(`📋 [OPTIMIZED_MESSAGE_SERVICE] Getting messages for conversation ${sessionId} from ${tableName}`);
      
      // Query ultra-simples - SELECT * sem dependência de autenticação
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('id', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting messages:`, error);
        return { data: [] };
      }

      // Processar mensagens com mapeamento dinâmico
      const processedMessages = (data || []).map((row: any) => {
        const mappedMessage = this.mapRowToRawMessage(row);
        
        // Verificar se há base64 para otimizar (em background, sem bloquear)
        if (row.media_base64 && typeof row.media_base64 === 'string' && row.media_base64.startsWith('data:')) {
          console.log(`🔄 [OPTIMIZED_MESSAGE_SERVICE] Found base64 in message ${row.id}, scheduling optimization`);
          
          // Processar em background (não bloquear a UI)
          setTimeout(() => {
            MediaStorageService.processAndReplaceBase64(
              tableName,
              row.id,
              row.media_base64
            ).catch(error => {
              console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Background base64 processing failed:`, error);
            });
          }, 100);
        }
        
        return mappedMessage;
      });

      console.log(`✅ [OPTIMIZED_MESSAGE_SERVICE] Successfully loaded ${processedMessages.length} messages for conversation ${sessionId}`);
      return { data: processedMessages };

    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Unexpected error:`, error);
      return { data: [] };
    }
  }

  // Mapeamento dinâmico que funciona com qualquer estrutura de tabela
  private mapRowToRawMessage(row: any): RawMessage {
    // Mapear nome do contato dinamicamente (diferentes formatos entre tabelas)
    const contactName = row.Nome_do_contato || row.nome_do_contato || 'Contato Anônimo';
    
    return {
      id: row.id?.toString() || '',
      session_id: row.session_id || '',
      message: row.message || '',
      sender: this.determineSender(row),
      timestamp: row.read_at || new Date().toISOString(),
      content: row.message || '',
      tipo_remetente: row.tipo_remetente,
      mensagemtype: row.mensagemtype,
      // Tratar ambos os formatos de nome de contato
      Nome_do_contato: contactName,
      nome_do_contato: contactName,
      media_base64: row.media_base64,
      read_at: row.read_at,
      is_read: row.is_read // Pode ser undefined para tabelas que não têm este campo
    };
  }

  private determineSender(row: any): 'customer' | 'agent' {
    if (row.tipo_remetente === 'USUARIO_INTERNO' || row.tipo_remetente === 'Yelena-ai') {
      return 'agent';
    }
    return 'customer';
  }

  async getConversations(limit = 20): Promise<ChannelConversation[]> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      console.log(`📋 [OPTIMIZED_MESSAGE_SERVICE] Getting conversations from ${tableName}`);
      
      // Query simples sem dependência de autenticação
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('id', { ascending: false })
        .limit(limit * 10);

      if (error) {
        console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting conversations:`, error);
        return [];
      }

      // Agrupar por session_id e pegar a mensagem mais recente de cada
      const conversationsMap = new Map<string, ChannelConversation>();
      
      (data || []).forEach((message: any) => {
        const sessionId = message.session_id;
        
        if (!conversationsMap.has(sessionId)) {
          // Determinar nome do contato usando campo correto baseado na tabela
          let contactName = 'Unknown';
          if (message.Nome_do_contato) {
            contactName = message.Nome_do_contato;
          } else if (message.nome_do_contato) {
            contactName = message.nome_do_contato;
          } else {
            contactName = this.extractPhoneFromSessionId(sessionId);
          }

          // Determinar status baseado no is_read (se existir)
          let status: 'unread' | 'in_progress' | 'resolved' = 'unread';
          if (message.is_read !== undefined) {
            status = message.is_read ? 'resolved' : 'unread';
          }

          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: contactName,
            contact_phone: this.extractPhoneFromSessionId(sessionId),
            last_message: this.formatLastMessage(message.message, message.mensagemtype),
            last_message_time: message.read_at || new Date().toISOString(),
            status: status,
            updated_at: message.read_at || new Date().toISOString(),
            unread_count: status === 'unread' ? 1 : 0
          });
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime())
        .slice(0, limit);

      console.log(`✅ [OPTIMIZED_MESSAGE_SERVICE] Successfully loaded ${conversations.length} conversations`);
      return conversations;

    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting conversations:`, error);
      return [];
    }
  }

  private formatLastMessage(message: string, messageType?: string): string {
    if (!message) return '';
    
    // Se for mídia, mostrar placeholder amigável
    if (messageType && messageType !== 'text' && messageType !== 'conversation') {
      switch (messageType) {
        case 'image': case 'imageMessage': return '📷 Imagem';
        case 'audio': case 'audioMessage': case 'ptt': return '🎵 Áudio';
        case 'video': case 'videoMessage': return '🎥 Vídeo';
        case 'document': case 'documentMessage': return '📄 Documento';
        default: return '📎 Mídia';
      }
    }

    // Se for URL do storage, mostrar placeholder
    if (message.includes('supabase.co/storage/v1/object/public/media-files/')) {
      return '📎 Mídia';
    }

    // Se for base64, mostrar placeholder
    if (message.startsWith('data:')) {
      if (message.includes('image/')) return '📷 Imagem';
      if (message.includes('audio/')) return '🎵 Áudio';
      if (message.includes('video/')) return '🎥 Vídeo';
      return '📎 Mídia';
    }

    // Truncar mensagens longas
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }

  private extractPhoneFromSessionId(sessionId: string): string {
    const match = sessionId.match(/(\d+)@/);
    return match ? match[1] : sessionId;
  }

  async migrateChannelBase64(): Promise<number> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    console.log(`🔄 [OPTIMIZED_MESSAGE_SERVICE] Starting base64 migration for channel ${this.channelId}`);
    
    return await MediaStorageService.migrateExistingBase64(tableName, 5);
  }
}
