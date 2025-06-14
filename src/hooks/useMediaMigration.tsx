
import { useState } from 'react';
import { MediaMigrationService } from '@/services/MediaMigrationService';
import { getTableNameForChannel } from '@/utils/channelMapping';

export const useMediaMigration = (channelId: string) => {
  const [migrationState, setMigrationState] = useState({
    isRunning: false,
    processed: 0,
    errors: 0,
    completed: false
  });

  const startMigration = async (batchSize: number = 5) => {
    const tableName = getTableNameForChannel(channelId);
    
    setMigrationState({
      isRunning: true,
      processed: 0,
      errors: 0,
      completed: false
    });

    try {
      let totalProcessed = 0;
      let totalErrors = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await MediaMigrationService.batchMigrateTableMedia(tableName, batchSize);
        
        totalProcessed += result.processed;
        totalErrors += result.errors;
        
        setMigrationState(prev => ({
          ...prev,
          processed: totalProcessed,
          errors: totalErrors
        }));

        // Se não processou nada, não há mais para migrar
        hasMore = result.processed > 0;
        
        // Pausa entre batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setMigrationState(prev => ({
        ...prev,
        isRunning: false,
        completed: true
      }));

      console.log(`✅ [MEDIA_MIGRATION] Channel migration completed: ${totalProcessed} processed, ${totalErrors} errors`);
      
    } catch (error) {
      console.error('❌ [MEDIA_MIGRATION] Migration failed:', error);
      setMigrationState(prev => ({
        ...prev,
        isRunning: false,
        errors: prev.errors + 1
      }));
    }
  };

  const resetMigration = () => {
    setMigrationState({
      isRunning: false,
      processed: 0,
      errors: 0,
      completed: false
    });
  };

  return {
    migrationState,
    startMigration,
    resetMigration
  };
};
