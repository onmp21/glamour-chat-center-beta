
import { OptimizedMessageService } from './OptimizedMessageService';
import { RawMessage, ChannelConversation } from '@/types/messages';
import { MediaStorageService } from './MediaStorageService';

export class MessageServiceV2 {
  private optimizedService: OptimizedMessageService;

  constructor(channelId?: string) {
    this.optimizedService = new OptimizedMessageService(channelId);
  }

  async getMessagesByConversation(sessionId: string, limit = 50): Promise<{ data: RawMessage[] }> {
    console.log(`📋 [MESSAGE_SERVICE_V2] Getting messages for conversation ${sessionId}`);
    return await this.optimizedService.getMessagesByConversation(sessionId, limit);
  }

  async getConversations(limit = 20): Promise<ChannelConversation[]> {
    console.log(`📋 [MESSAGE_SERVICE_V2] Getting conversations with limit ${limit}`);
    return await this.optimizedService.getConversations(limit);
  }

  async saveMessage(messageData: Partial<RawMessage>): Promise<RawMessage> {
    console.log(`💾 [MESSAGE_SERVICE_V2] Saving message`);
    
    // Se a mensagem contém base64, processar automaticamente
    if (messageData.content && messageData.content.startsWith('data:')) {
      console.log(`🔄 [MESSAGE_SERVICE_V2] Detected base64 content, processing...`);
      
      const uploadResult = await MediaStorageService.uploadBase64ToStorage(messageData.content);
      
      if (uploadResult.success) {
        messageData.content = uploadResult.url!;
        messageData.media_base64 = uploadResult.url!;
        console.log(`✅ [MESSAGE_SERVICE_V2] Base64 processed and uploaded to storage`);
      } else {
        console.error(`❌ [MESSAGE_SERVICE_V2] Failed to upload base64:`, uploadResult.error);
      }
    }

    // Usar o serviço original para salvar (mantendo compatibilidade)
    const { MessageService } = await import('./MessageService');
    const originalService = new MessageService();
    return await originalService.saveMessage(messageData);
  }

  async migrateBase64(): Promise<void> {
    console.log(`🔄 [MESSAGE_SERVICE_V2] Starting base64 migration`);
    
    const processed = await this.optimizedService.migrateChannelBase64();
    
    if (processed > 0) {
      console.log(`✅ [MESSAGE_SERVICE_V2] Migration completed: ${processed} records processed`);
    } else {
      console.log(`ℹ️ [MESSAGE_SERVICE_V2] No base64 records found to migrate`);
    }
  }

  async processBackgroundOptimization(): Promise<void> {
    console.log(`🔄 [MESSAGE_SERVICE_V2] Starting background optimization`);
    
    // Executar migração em background sem bloquear a UI
    setTimeout(async () => {
      try {
        await this.migrateBase64();
      } catch (error) {
        console.error(`❌ [MESSAGE_SERVICE_V2] Background optimization failed:`, error);
      }
    }, 2000); // Aguardar 2 segundos para não afetar o carregamento inicial
  }
}
