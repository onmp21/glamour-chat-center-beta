
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
      
      // Query mais robusta com tratamento de diferentes estruturas de tabela
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          id,
          session_id,
          message,
          read_at,
          tipo_remetente,
          mensagemtype,
          media_base64,
          is_read,
          Nome_do_contato,
          nome_do_contato
        `)
        .eq('session_id', sessionId)
        .order('read_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Error getting messages:`, error);
        
        // Fallback: tentar query mais simples
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('session_id', sessionId)
          .order('id', { ascending: true })
          .limit(limit);

        if (fallbackError) {
          console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Fallback query also failed:`, fallbackError);
          return { data: [] };
        }

        const mappedFallbackData = (fallbackData || []).map(row => repository.mapDatabaseRowToRawMessage(row));
        console.log(`✅ [OPTIMIZED_MESSAGE_SERVICE] Fallback query successful: ${mappedFallbackData.length} messages`);
        return { data: mappedFallbackData };
      }

      // Processar mensagens e otimizar base64
      const processedMessages = await Promise.all(
        (data || []).map(async (row) => {
          const mappedMessage = repository.mapDatabaseRowToRawMessage(row);
          
          // Verificar se há base64 para otimizar
          if (row.media_base64 && row.media_base64.startsWith('data:')) {
            console.log(`🔄 [OPTIMIZED_MESSAGE_SERVICE] Found base64 in message ${row.id}, scheduling optimization`);
            
            // Processar em background (não bloquear a UI)
            MediaStorageService.processAndReplaceBase64(
              tableName,
              row.id,
              row.media_base64
            ).catch(error => {
              console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Background base64 processing failed:`, error);
            });
          }
          
          return mappedMessage;
        })
      );

      console.log(`✅ [OPTIMIZED_MESSAGE_SERVICE] Successfully loaded ${processedMessages.length} messages for conversation ${sessionId}`);
      return { data: processedMessages };

    } catch (error) {
      console.error(`❌ [OPTIMIZED_MESSAGE_SERVICE] Unexpected error:`, error);
      return { data: [] };
    }
  }

  async getConversations(limit = 20): Promise<ChannelConversation[]> {
    const repository = this.getRepository();
    const tableName = repository.getTableName();
    
    try {
      console.log(`📋 [OPTIMIZED_MESSAGE_SERVICE] Getting conversations from ${tableName}`);
      
      // Query otimizada para buscar últimas mensagens por session_id
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          session_id,
          message,
          read_at,
          is_read,
          Nome_do_contato,
          nome_do_contato,
          mensagemtype
        `)
        .order('read_at', { ascending: false })
        .limit(limit * 10); // Buscar mais para garantir que temos conversas suficientes

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

          conversationsMap.set(sessionId, {
            id: sessionId,
            contact_name: contactName,
            contact_phone: this.extractPhoneFromSessionId(sessionId),
            last_message: this.formatLastMessage(message.message, message.mensagemtype),
            last_message_time: message.read_at || new Date().toISOString(),
            status: message.is_read ? 'resolved' : 'unread',
            updated_at: message.read_at || new Date().toISOString(),
            unread_count: message.is_read ? 0 : 1
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
