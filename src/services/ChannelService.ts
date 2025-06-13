
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { MessageRepository } from '@/repositories/MessageRepository';
import { MessageService } from './MessageService';
import { ChannelMessage } from '@/types/messages';
import { DetailedLogger } from './DetailedLogger';

export interface ChannelServiceConfig {
  channelId: string;
  tableName: TableName;
}

export class ChannelService {
  private config: ChannelServiceConfig;
  private messageRepository: MessageRepository;
  private messageService: MessageService;
  private logger: DetailedLogger;

  constructor(channelId: string) {
    this.config = {
      channelId,
      tableName: getTableNameForChannel(channelId)
    };
    this.messageRepository = new MessageRepository(this.config.tableName);
    this.messageService = new MessageService(channelId);
  }

  getTableName(): TableName {
    return this.config.tableName;
  }

  getChannelId(): string {
    return this.config.channelId;
  }

  async fetchMessages() {
    DetailedLogger.info("ChannelService", `Buscando mensagens da tabela: ${this.config.tableName} para o canal: ${this.config.channelId}`);
    return await this.messageRepository.findAll();
  }

  async getConversations() {
    DetailedLogger.info("ChannelService", `Buscando conversas para o canal: ${this.config.channelId}`);
    return await this.messageService.getConversations();
  }

  async insertMessage(sessionId: string, message: string, contactName?: string) {
    DetailedLogger.info("ChannelService", `Inserindo mensagem na tabela ${this.config.tableName}`, { sessionId });
    return await this.messageRepository.insertMessage(sessionId, message, contactName);
  }
  
  async getNewMessagesAfterTimestamp(timestamp: string) {
    DetailedLogger.info("ChannelService", `Buscando novas mensagens após ${timestamp}`, { tableName: this.config.tableName });
    return await this.messageRepository.findMessagesAfterTimestamp(timestamp);
  }
}


