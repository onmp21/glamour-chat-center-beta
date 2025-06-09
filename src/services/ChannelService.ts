
import { TableName, getTableNameForChannel } from '@/utils/channelMapping';
import { MessageRepository } from '@/repositories/MessageRepository';

export interface ChannelServiceConfig {
  channelId: string;
  tableName: TableName;
}

export class ChannelService {
  private config: ChannelServiceConfig;
  private messageRepository: MessageRepository;

  constructor(channelId: string) {
    this.config = {
      channelId,
      tableName: getTableNameForChannel(channelId)
    };
    this.messageRepository = new MessageRepository(this.config.tableName);
  }

  getTableName(): TableName {
    return this.config.tableName;
  }

  getChannelId(): string {
    return this.config.channelId;
  }

  async fetchMessages() {
    console.log(`🔍 [CHANNEL_SERVICE] Fetching messages from table: ${this.config.tableName} for channel: ${this.config.channelId}`);
    
    return await this.messageRepository.findAll();
  }

  async insertMessage(sessionId: string, message: string, contactName?: string) {
    console.log(`💾 [CHANNEL_SERVICE] Inserting message into ${this.config.tableName}`);
    
    return await this.messageRepository.insertMessage(sessionId, message, contactName);
  }

  createRealtimeChannel(channelSuffix: string = '') {
    return this.messageRepository.createRealtimeChannel(channelSuffix);
  }
}
