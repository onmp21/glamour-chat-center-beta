
import { useState } from 'react';
import { MediaStorageService } from '@/services/MediaStorageService';

interface MigrationProgress {
  currentTable: string;
  processed: number;
  total: number;
  isRunning: boolean;
  error?: string;
}

export const useMediaMigration = () => {
  const [progress, setProgress] = useState<MigrationProgress>({
    currentTable: '',
    processed: 0,
    total: 0,
    isRunning: false
  });

  const migrateTables = async (tables: string[] = [
    'yelena_ai_conversas',
    'gerente_externo_conversas',
    'canarana_conversas',
    'souto_soares_conversas',
    'joao_dourado_conversas',
    'america_dourada_conversas',
    'gerente_lojas_conversas'
  ]) => {
    setProgress(prev => ({ ...prev, isRunning: true, error: undefined }));

    try {
      for (const tableName of tables) {
        setProgress(prev => ({ 
          ...prev, 
          currentTable: tableName,
          processed: 0 
        }));

        console.log(`🔄 [MIGRATION] Starting migration for table: ${tableName}`);
        
        const processedCount = await MediaStorageService.migrateExistingBase64(tableName, 5);
        
        setProgress(prev => ({ 
          ...prev, 
          processed: prev.processed + processedCount 
        }));

        console.log(`✅ [MIGRATION] Completed ${tableName}: ${processedCount} records migrated`);
      }

      setProgress(prev => ({ 
        ...prev, 
        isRunning: false,
        currentTable: 'Concluído' 
      }));

      console.log('✅ [MIGRATION] All tables migration completed');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Migration failed:', error);
      setProgress(prev => ({ 
        ...prev, 
        isRunning: false,
        error: error instanceof Error ? error.message : 'Migration failed' 
      }));
    }
  };

  return {
    progress,
    migrateTables
  };
};
