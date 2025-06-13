
import { MessageRepository } from '@/repositories/MessageRepository';
import { RawMessage, ChannelConversation, ChannelMessage } from '@/types/messages';
import { MessageTypeMapper } from '@/utils/MessageTypeMapper';
import { getTableNameForChannel } from '@/utils/channelMapping';
import { MessageConverter } from '@/utils/MessageConverter';
import { ConversationGrouper } from '@/utils/ConversationGrouper';
import { PhoneExtractor } from '@/utils/PhoneExtractor';
import { PaginationService, CursorPaginationResult } from './PaginationService';
import { DetailedLogger } from './DetailedLogger';

export class MessageService {
  private repository: MessageRepository;
  private channelId: string;

  constructor(channelId: string) {
    this.channelId = channelId;
    const tableName = getTableNameForChannel(channelId);
    this.repository = new MessageRepository(tableName);
  }

  async getAllMessages(options?: { limit?: number; offset?: number; page?: number }): Promise<ChannelMessage[]> {
    DetailedLogger.info("MessageService", `Carregando mensagens para o canal ${this.channelId}`, { options });
    
    try {
      // Se tiver page, usar paginação
      if (options?.page !== undefined) {
        const paginationResult = await PaginationService.paginateQuery<RawMessage>(
          this.repository.tableName,
          {
            page: options.page,
            limit: options.limit || 50,
            sortBy: 'id',
            sortOrder: 'desc'
          }
        );
        
        DetailedLogger.info("MessageService", `Mensagens carregadas com paginação`, { 
          count: paginationResult.data.length,
          totalItems: paginationResult.pagination.totalItems,
          currentPage: paginationResult.pagination.currentPage,
          totalPages: paginationResult.pagination.totalPages
        });
        
        return paginationResult.data.map(rawMessage => 
          MessageConverter.rawToChannelMessage(rawMessage)
        );
      } else {
        // Método original para compatibilidade
        const rawMessages = await this.repository.findAll(options?.limit, options?.offset);
        DetailedLogger.info("MessageService", `Mensagens carregadas sem paginação`, { count: rawMessages.length });
        
        // Map to ChannelMessage format with support for media_base64
        return rawMessages.map(rawMessage => {
          const channelMessage = MessageConverter.rawToChannelMessage(rawMessage);

          // Log detalhado para debug de mídia
          if (rawMessage.mensagemtype && rawMessage.mensagemtype !== 'text') {
            DetailedLogger.debug("MessageService", `Mensagem de mídia mapeada`, {
              id: rawMessage.id,
              mensagemtype: rawMessage.mensagemtype,
              hasMediaBase64: !!rawMessage.media_base64,
              mediaContentLength: rawMessage.media_base64?.length || 0,
              messageContentLength: rawMessage.message.length
            });
          }

          return channelMessage;
        });
      }
    } catch (error) {
      DetailedLogger.error("MessageService", `Erro ao carregar mensagens para o canal ${this.channelId}`, { error });
      throw error;
    }
  }

  async getMessagesByConversation(
    conversationId: string, 
    options?: { limit?: number; offset?: number; cursor?: string }
  ): Promise<CursorPaginationResult<ChannelMessage>> {
    DetailedLogger.info("MessageService", `Carregando mensagens para a conversa ${conversationId}`, { options });
    
    try {
      // Usar paginação baseada em cursor para melhor performance
      const paginationResult = await PaginationService.paginateMessages<RawMessage>(
        this.repository.tableName,
        conversationId,
        {
          limit: options?.limit || 50,
          cursor: options?.cursor,
          sortBy: 'id',
          sortOrder: 'desc'
        }
      );
      
      DetailedLogger.info("MessageService", `Mensagens da conversa carregadas`, { 
        count: paginationResult.data.length,
        hasMore: paginationResult.hasMore,
        nextCursor: paginationResult.nextCursor
      });
      
      // Converter para formato ChannelMessage
      const channelMessages = paginationResult.data.map(rawMessage => 
        MessageConverter.rawToChannelMessage(rawMessage)
      );
      
      return {
        data: channelMessages,
        nextCursor: paginationResult.nextCursor,
        hasMore: paginationResult.hasMore
      };
    } catch (error) {
      DetailedLogger.error("MessageService", `Erro ao carregar mensagens para a conversa ${conversationId}`, { error });
      throw error;
    }
  }

  async getConversations(): Promise<ChannelConversation[]> {
    DetailedLogger.info("MessageService", `Carregando conversas para o canal ${this.channelId}`);
    
    try {
      // Otimização: Obter apenas a contagem total de mensagens para estatísticas
      const totalMessagesCount = await this.repository.countAll();
      DetailedLogger.info("MessageService", `Total de mensagens no canal ${this.channelId}`, { count: totalMessagesCount });

      // Para agrupar conversas, ainda precisamos de todas as mensagens para extrair os IDs de sessão únicos.
      // Podemos limitar a quantidade de mensagens para melhorar a performance
      const rawMessages = await this.repository.findAll(1000); // Limitar a 1000 mensagens mais recentes
      return ConversationGrouper.groupMessagesByPhone(rawMessages, this.channelId);
    } catch (error) {
      DetailedLogger.error("MessageService", `Erro ao carregar conversas para o canal ${this.channelId}`, { error });
      throw error;
    }
  }

  async searchMessages(
    searchTerm: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ messages: ChannelMessage[], pagination: any }> {
    DetailedLogger.info("MessageService", `Pesquisando mensagens no canal ${this.channelId}`, { searchTerm, options });
    
    try {
      const result = await PaginationService.searchWithPagination<RawMessage>(
        this.repository.tableName,
        searchTerm,
        ['message', 'Nome_do_contato', 'session_id'],
        {
          page: options?.page || 1,
          limit: options?.limit || 20,
          sortBy: 'id',
          sortOrder: 'desc'
        }
      );
      
      DetailedLogger.info("MessageService", `Resultados da pesquisa`, { 
        count: result.data.length,
        totalItems: result.pagination.totalItems
      });
      
      return {
        messages: result.data.map(rawMessage => 
          MessageConverter.rawToChannelMessage(rawMessage)
        ),
        pagination: result.pagination
      };
    } catch (error) {
      DetailedLogger.error("MessageService", `Erro na pesquisa de mensagens`, { error, searchTerm });
      throw error;
    }
  }

  async sendMessage(sessionId: string, content: string, agentName?: string): Promise<RawMessage> {
    DetailedLogger.info("MessageService", `Enviando mensagem para o canal ${this.channelId}`, { sessionId });
    
    try {
      return await this.repository.insertMessage(sessionId, content, agentName);
    } catch (error) {
      DetailedLogger.error("MessageService", `Erro ao enviar mensagem para o canal ${this.channelId}`, { error, sessionId });
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    DetailedLogger.info("MessageService", `Marcando conversa como lida: ${conversationId}`);
    
    try {
      await this.repository.markAsRead(conversationId);
    } catch (error) {
      DetailedLogger.error("MessageService", `Erro ao marcar conversa como lida ${conversationId}`, { error });
      throw error;
    }
  }

  createRealtimeSubscription(callback: (payload: any) => void, conversationId?: string) {
     const suffix = conversationId ? `-${conversationId}` : "";
    const channel = this.repository
      .createRealtimeChannel(suffix)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: this.repository.tableNamePublic,
        },
        callback
      );

    return channel;
    }

  public extractPhoneFromSessionId(sessionId: string): string {
    return PhoneExtractor.extractPhoneFromSessionId(sessionId);
  }
}