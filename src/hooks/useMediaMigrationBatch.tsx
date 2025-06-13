
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  success: boolean;
  totalProcessed: number;
  totalErrors: number;
  tableResults: Record<string, { processed: number; errors: number }>;
  message: string;
}

export const useMediaMigrationBatch = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MigrationResult | null>(null);

  const runBatchMigration = async (): Promise<MigrationResult> => {
    setIsRunning(true);
    
    try {
      console.log('🚀 [BATCH_MIGRATION] Starting batch migration');
      
      const { data, error } = await supabase.functions.invoke('migrate-base64-batch');

      if (error) {
        throw error;
      }

      const result = data as MigrationResult;
      setLastResult(result);

      if (result.success) {
        console.log(`✅ [BATCH_MIGRATION] Completed: ${result.totalProcessed} processed, ${result.totalErrors} errors`);
        toast.success(`Migração concluída: ${result.totalProcessed} processados`);
      } else {
        console.error(`❌ [BATCH_MIGRATION] Failed:`, result.message);
        toast.error('Erro na migração em lote');
      }

      return result;

    } catch (error) {
      console.error('❌ [BATCH_MIGRATION] Error:', error);
      const errorResult: MigrationResult = {
        success: false,
        totalProcessed: 0,
        totalErrors: 1,
        tableResults: {},
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      setLastResult(errorResult);
      toast.error('Erro ao executar migração em lote');
      return errorResult;
      
    } finally {
      setIsRunning(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      // Verificar quantas mensagens ainda têm base64 em cada tabela
      const tables = [
        'yelena_ai_conversas',
        'canarana_conversas', 
        'souto_soares_conversas',
        'joao_dourado_conversas',
        'america_dourada_conversas',
        'gerente_lojas_conversas',
        'gerente_externo_conversas'
      ];

      const status: Record<string, number> = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.rpc('get_base64_messages', {
            table_name: table,
            batch_size: 1000 // Verificar mais para ter uma estimativa
          });

          if (!error && data) {
            status[table] = data.length;
          }
        } catch (err) {
          console.error(`Error checking ${table}:`, err);
        }
      }

      return status;
    } catch (error) {
      console.error('❌ [MIGRATION_STATUS] Error:', error);
      return {};
    }
  };

  return {
    isRunning,
    lastResult,
    runBatchMigration,
    checkMigrationStatus
  };
};
