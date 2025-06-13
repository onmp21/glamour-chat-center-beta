
import { supabase } from '@/integrations/supabase/client';

export class Base64MigrationService {
  static async migrateAllTables(): Promise<{
    success: boolean;
    results: Array<{
      table: string;
      status: string;
      processed: number;
      total?: number;
      error?: string;
    }>;
  }> {
    try {
      console.log('🔄 [BASE64_MIGRATION] Starting migration for all tables');
      
      const { data, error } = await supabase.functions.invoke('migrate-base64-enhanced', {
        body: {
          tables: [
            'yelena_ai_conversas',
            'canarana_conversas',
            'souto_soares_conversas', 
            'joao_dourado_conversas',
            'america_dourada_conversas',
            'gerente_lojas_conversas',
            'gerente_externo_conversas'
          ],
          batchSize: 5
        }
      });

      if (error) {
        console.error('❌ [BASE64_MIGRATION] Error calling migration function:', error);
        return {
          success: false,
          results: [{
            table: 'all',
            status: 'error',
            processed: 0,
            error: error.message
          }]
        };
      }

      console.log('✅ [BASE64_MIGRATION] Migration completed successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ [BASE64_MIGRATION] Migration failed:', error);
      return {
        success: false,
        results: [{
          table: 'all',
          status: 'error',
          processed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  static async migrateSpecificTable(tableName: string, batchSize: number = 5): Promise<{
    success: boolean;
    results: Array<{
      table: string;
      status: string;
      processed: number;
      total?: number;
      error?: string;
    }>;
  }> {
    try {
      console.log(`🔄 [BASE64_MIGRATION] Starting migration for table: ${tableName}`);
      
      const { data, error } = await supabase.functions.invoke('migrate-base64-enhanced', {
        body: {
          tables: [tableName],
          batchSize
        }
      });

      if (error) {
        console.error(`❌ [BASE64_MIGRATION] Error migrating ${tableName}:`, error);
        return {
          success: false,
          results: [{
            table: tableName,
            status: 'error',
            processed: 0,
            error: error.message
          }]
        };
      }

      console.log(`✅ [BASE64_MIGRATION] Migration completed for ${tableName}:`, data);
      return data;
      
    } catch (error) {
      console.error(`❌ [BASE64_MIGRATION] Migration failed for ${tableName}:`, error);
      return {
        success: false,
        results: [{
          table: tableName,
          status: 'error',
          processed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  static async checkPendingMigrations(): Promise<{
    hasPending: boolean;
    tables: string[];
    totalPending: number;
  }> {
    try {
      console.log('🔍 [BASE64_MIGRATION] Checking for pending migrations');
      
      const tables = [
        'yelena_ai_conversas',
        'canarana_conversas',
        'souto_soares_conversas',
        'joao_dourado_conversas', 
        'america_dourada_conversas',
        'gerente_lojas_conversas',
        'gerente_externo_conversas'
      ];

      let totalPending = 0;
      const tablesWithPending: string[] = [];

      for (const tableName of tables) {
        try {
          const { data, error } = await supabase.rpc('get_base64_messages', {
            table_name: tableName,
            batch_size: 1
          });

          if (!error && data && data.length > 0) {
            tablesWithPending.push(tableName);
            totalPending += data.length;
          }
        } catch (error) {
          console.warn(`⚠️ [BASE64_MIGRATION] Could not check ${tableName}:`, error);
        }
      }

      const result = {
        hasPending: totalPending > 0,
        tables: tablesWithPending,
        totalPending
      };

      console.log('📊 [BASE64_MIGRATION] Pending migrations check result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ [BASE64_MIGRATION] Error checking pending migrations:', error);
      return {
        hasPending: false,
        tables: [],
        totalPending: 0
      };
    }
  }
}
