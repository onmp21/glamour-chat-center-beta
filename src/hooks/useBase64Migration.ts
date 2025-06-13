
import { useState, useEffect } from 'react';
import { Base64MigrationService } from '@/services/Base64MigrationService';

interface MigrationResult {
  table: string;
  status: string;
  processed: number;
  total?: number;
  error?: string;
}

export const useBase64Migration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [pendingTables, setPendingTables] = useState<string[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [lastResults, setLastResults] = useState<MigrationResult[]>([]);

  // Verificar migrações pendentes ao carregar
  useEffect(() => {
    checkPendingMigrations();
  }, []);

  const checkPendingMigrations = async () => {
    try {
      const result = await Base64MigrationService.checkPendingMigrations();
      setHasPending(result.hasPending);
      setPendingTables(result.tables);
      setTotalPending(result.totalPending);
    } catch (error) {
      console.error('❌ [USE_BASE64_MIGRATION] Error checking pending migrations:', error);
    }
  };

  const migrateAllTables = async (): Promise<{ success: boolean; results: MigrationResult[] }> => {
    setIsLoading(true);
    try {
      const result = await Base64MigrationService.migrateAllTables();
      setLastResults(result.results);
      
      if (result.success) {
        // Recheck pending after migration
        await checkPendingMigrations();
      }
      
      return result;
    } catch (error) {
      console.error('❌ [USE_BASE64_MIGRATION] Migration failed:', error);
      return {
        success: false,
        results: [{
          table: 'all',
          status: 'error',
          processed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

  const migrateTable = async (tableName: string): Promise<{ success: boolean; results: MigrationResult[] }> => {
    setIsLoading(true);
    try {
      const result = await Base64MigrationService.migrateSpecificTable(tableName);
      setLastResults(result.results);
      
      if (result.success) {
        // Recheck pending after migration
        await checkPendingMigrations();
      }
      
      return result;
    } catch (error) {
      console.error(`❌ [USE_BASE64_MIGRATION] Migration failed for ${tableName}:`, error);
      return {
        success: false,
        results: [{
          table: tableName,
          status: 'error',
          processed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    hasPending,
    pendingTables,
    totalPending,
    lastResults,
    checkPendingMigrations,
    migrateAllTables,
    migrateTable
  };
};
