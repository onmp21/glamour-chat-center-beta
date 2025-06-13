
import { supabase } from '@/integrations/supabase/client';
import { MediaStorageService } from './MediaStorageService';

export class MediaMigrationService {
  private static readonly STORAGE_URL_PATTERN = /supabase\.co\/storage\/v1\/object\/public\/media-files\//;

  static async migrateMessageMedia(
    tableName: string,
    messageId: string,
    base64Content: string
  ): Promise<{ success: boolean; storageUrl?: string; error?: string }> {
    try {
      console.log(`🔄 [MEDIA_MIGRATION] Starting migration for message ${messageId} in ${tableName}`);

      // Upload base64 para storage
      const uploadResult = await MediaStorageService.uploadBase64ToStorage(base64Content);
      
      if (!uploadResult.success || !uploadResult.url) {
        return { success: false, error: uploadResult.error };
      }

      // Atualizar a mensagem na tabela
      const { error: updateError } = await supabase
        .from(tableName as any)
        .update({
          message: uploadResult.url,
          media_base64: null // Limpar o base64 após migração
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`❌ [MEDIA_MIGRATION] Database update error:`, updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ [MEDIA_MIGRATION] Successfully migrated message ${messageId}`);
      return { success: true, storageUrl: uploadResult.url };

    } catch (error) {
      console.error(`❌ [MEDIA_MIGRATION] Migration failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async batchMigrateTableMedia(
    tableName: string,
    batchSize: number = 5
  ): Promise<{ processed: number; errors: number }> {
    try {
      console.log(`🔄 [MEDIA_MIGRATION] Starting batch migration for ${tableName}`);

      // Buscar mensagens com base64
      const { data: messages, error: fetchError } = await supabase
        .from(tableName as any)
        .select('id, media_base64')
        .not('media_base64', 'is', null)
        .limit(batchSize);

      if (fetchError) {
        console.error(`❌ [MEDIA_MIGRATION] Fetch error:`, fetchError);
        return { processed: 0, errors: 1 };
      }

      if (!messages || messages.length === 0) {
        console.log(`✅ [MEDIA_MIGRATION] No base64 messages to migrate in ${tableName}`);
        return { processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const message of messages) {
        if (message.media_base64) {
          const result = await this.migrateMessageMedia(
            tableName,
            message.id,
            message.media_base64
          );

          if (result.success) {
            processed++;
          } else {
            errors++;
            console.error(`❌ [MEDIA_MIGRATION] Failed to migrate message ${message.id}:`, result.error);
          }

          // Pausa entre migrações para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`✅ [MEDIA_MIGRATION] Batch completed: ${processed} processed, ${errors} errors`);
      return { processed, errors };

    } catch (error) {
      console.error(`❌ [MEDIA_MIGRATION] Batch migration failed:`, error);
      return { processed: 0, errors: 1 };
    }
  }

  static isStorageUrl(content: string): boolean {
    return this.STORAGE_URL_PATTERN.test(content);
  }

  static isBase64Content(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // Verificar se é data URL base64
    if (content.startsWith('data:')) return true;
    
    // Verificar se é base64 puro (pelo menos 50 chars e padrão base64)
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Pattern.test(content.replace(/\s/g, ''));
  }

  static async autoMigrateOnLoad(
    tableName: string,
    messageId: string,
    content: string
  ): Promise<string> {
    // Se já é URL do storage, retornar como está
    if (this.isStorageUrl(content)) {
      return content;
    }

    // Se é base64, migrar em background
    if (this.isBase64Content(content)) {
      console.log(`🔄 [MEDIA_MIGRATION] Auto-migrating base64 for message ${messageId}`);
      
      // Migrar em background sem bloquear a UI
      setTimeout(async () => {
        await this.migrateMessageMedia(tableName, messageId, content);
      }, 100);

      // Retornar o base64 para exibição imediata
      return content;
    }

    return content;
  }
}
