
import { ChannelMappingRepository } from '../repositories/ChannelMappingRepository';
import { ChannelUuidResolver } from './ChannelUuidResolver';
import { EvolutionMessagingService } from './EvolutionMessagingService';
import { ChannelMessagePersistence } from './ChannelMessagePersistence';
import { RawMessage } from '@/types/messageTypes';

export class ChannelApiMappingService {
  constructor() {}

  static async fetchMappings() {
    return ChannelMappingRepository.fetchMappings();
  }

  static async getMappings() {
    return ChannelMappingRepository.getMappings();
  }

  static async getChannelUuid(legacyId: string): Promise<string | null> {
    return ChannelUuidResolver.getChannelUuid(legacyId);
  }

  static async getApiInstanceForChannel(channelId: string) {
    return ChannelMappingRepository.getApiInstanceForChannel(channelId);
  }

  static async sendMessageViaEvolution(
    channelId: string,
    conversationId: string,
    content: string,
    mediaUrl?: string
  ): Promise<boolean> {
    return EvolutionMessagingService.sendMessageViaEvolution(channelId, conversationId, content, mediaUrl);
  }

  static async saveMessageToChannel(channelId: string, message: RawMessage): Promise<void> {
    return ChannelMessagePersistence.saveMessageToChannel(channelId, message);
  }

  static clearCache(): void {
    ChannelMappingRepository.clearCache();
  }
}
