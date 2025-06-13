
import { supabase } from '@/integrations/supabase/client';

export class MediaStorageService {
  private static bucketName = 'media-files';

  static async uploadBase64ToStorage(
    base64Content: string,
    fileName?: string,
    mimeType?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('📤 [MEDIA_STORAGE] Starting base64 upload to storage');

      // Extract pure base64 (remove data:mime;base64, if exists)
      const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '');
      
      // Detect MIME type if not provided
      if (!mimeType) {
        mimeType = this.detectMimeType(base64Content);
      }

      // Generate filename if not provided
      if (!fileName) {
        const extension = this.getExtensionFromMimeType(mimeType);
        fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${extension}`;
      }

      // Convert base64 to blob
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error('❌ [MEDIA_STORAGE] Upload error:', error);
        return { success: false, error: error.message };
      }

      // Generate public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log('✅ [MEDIA_STORAGE] Upload successful:', publicUrl);
      return { success: true, url: publicUrl };

    } catch (error) {
      console.error('❌ [MEDIA_STORAGE] Upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static detectMimeType(base64Content: string): string {
    if (base64Content.includes('data:')) {
      const match = base64Content.match(/data:([^;]+)/);
      if (match) return match[1];
    }

    // Fallback for signature detection
    const cleanBase64 = base64Content.replace(/^data:[^;]+;base64,/, '');
    
    if (cleanBase64.startsWith('/9j/')) return 'image/jpeg';
    if (cleanBase64.startsWith('iVBORw')) return 'image/png';
    if (cleanBase64.startsWith('R0lGO')) return 'image/gif';
    if (cleanBase64.startsWith('UklGR')) return 'image/webp';
    if (cleanBase64.startsWith('SUQz') || cleanBase64.startsWith('//uQ')) return 'audio/mpeg';
    if (cleanBase64.startsWith('T2dn')) return 'audio/ogg';
    if (cleanBase64.startsWith('AAAAGG') || cleanBase64.startsWith('AAAAFG')) return 'video/mp4';
    
    return 'application/octet-stream';
  }

  private static getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'video/mp4': '.mp4',
      'application/pdf': '.pdf'
    };
    return extensions[mimeType] || '.bin';
  }

  static async processAndReplaceBase64(
    tableName: string,
    recordId: number,
    base64Content: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log(`🔄 [MEDIA_STORAGE] Processing base64 for table ${tableName}, record ${recordId}`);

      // Upload to storage
      const uploadResult = await this.uploadBase64ToStorage(base64Content);
      
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update record in table
      const { error } = await supabase.rpc('update_media_url', {
        table_name: tableName,
        record_id: recordId,
        media_url: uploadResult.url!,
        placeholder_message: this.getPlaceholderMessage(base64Content)
      });

      if (error) {
        console.error('❌ [MEDIA_STORAGE] Database update error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [MEDIA_STORAGE] Successfully processed and replaced base64');
      return { success: true, url: uploadResult.url };

    } catch (error) {
      console.error('❌ [MEDIA_STORAGE] Process failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static getPlaceholderMessage(base64Content: string): string {
    const mimeType = this.detectMimeType(base64Content);
    
    if (mimeType.startsWith('image/')) return '[Imagem]';
    if (mimeType.startsWith('audio/')) return '[Áudio]';
    if (mimeType.startsWith('video/')) return '[Vídeo]';
    if (mimeType === 'application/pdf') return '[Documento PDF]';
    
    return '[Mídia]';
  }

  static async migrateExistingBase64(tableName: string, batchSize: number = 5): Promise<number> {
    try {
      console.log(`🔄 [MEDIA_STORAGE] Starting migration for table ${tableName}`);

      const { data, error } = await supabase.rpc('get_base64_messages', {
        table_name: tableName,
        batch_size: batchSize
      });

      if (error) {
        console.error('❌ [MEDIA_STORAGE] Migration query error:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        console.log(`✅ [MEDIA_STORAGE] No base64 messages to migrate in ${tableName}`);
        return 0;
      }

      let processedCount = 0;

      for (const record of data) {
        if (record.media_base64 && record.media_base64.startsWith('data:')) {
          const result = await this.processAndReplaceBase64(
            tableName,
            record.id,
            record.media_base64
          );

          if (result.success) {
            processedCount++;
            console.log(`✅ [MEDIA_STORAGE] Migrated record ${record.id} in ${tableName}`);
          } else {
            console.error(`❌ [MEDIA_STORAGE] Failed to migrate record ${record.id}:`, result.error);
          }

          // Pause between uploads to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ [MEDIA_STORAGE] Migration completed for ${tableName}: ${processedCount} records processed`);
      return processedCount;

    } catch (error) {
      console.error(`❌ [MEDIA_STORAGE] Migration failed for ${tableName}:`, error);
      return 0;
    }
  }
}
