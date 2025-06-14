
import { MessageService } from './MessageService';
import { ChannelConversation } from '@/types/messages';

export class ChannelService {
  private messageService: MessageService;
  private channelId: string;

  constructor(channelId: string) {
    this.channelId = channelId;
    this.messageService = new MessageService(channelId);
  }

  async getConversations(): Promise<ChannelConversation[]> {
    try {
      console.log(`📋 [CHANNEL_SERVICE] Getting conversations for channel: ${this.channelId}`);
      return await this.messageService.getConversations();
    } catch (error) {
      console.error(`❌ [CHANNEL_SERVICE] Error getting conversations for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getMessages(limit?: number) {
    try {
      console.log(`📋 [CHANNEL_SERVICE] Getting messages for channel: ${this.channelId}`);
      return await this.messageService.getMessagesForChannel(limit);
    } catch (error) {
      console.error(`❌ [CHANNEL_SERVICE] Error getting messages for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async fetchMessages(limit?: number) {
    return this.getMessages(limit);
  }

  async getNewMessagesAfterTimestamp(timestamp: string) {
    try {
      return await this.messageService.getNewMessagesAfterTimestamp(timestamp);
    } catch (error) {
      console.error(`❌ [CHANNEL_SERVICE] Error getting new messages for channel ${this.channelId}:`, error);
      throw error;
    }
  }

  async getChannelStats() {
    try {
      return await this.messageService.getChannelStats();
    } catch (error) {
      console.error(`❌ [CHANNEL_SERVICE] Error getting stats for channel ${this.channelId}:`, error);
      throw error;
    }
  }
}
