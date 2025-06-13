
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  success: boolean;
  totalProcessed: number;
  totalErrors: number;
  tableResults: Record<string, { processed: number; errors: number }>;
  message: string;
}

export const MediaMigrationPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MigrationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const startMigration = async () => {
    setIsRunning(true);
    setProgress(0);
    setLastResult(null);

    try {
      toast.info('Iniciando migração de base64 para storage...');
      
      // Simular progresso durante a migração
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('migrate-base64-batch');

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      const result = data as MigrationResult;
      setLastResult(result);

      if (result.success) {
        toast.success(`Migração concluída: ${result.totalProcessed} processados, ${result.totalErrors} erros`);
      } else {
        toast.error(`Erro na migração: ${result.message}`);
      }

    } catch (error) {
      console.error('❌ [MIGRATION_PANEL] Error:', error);
      toast.error('Erro ao executar migração');
      setLastResult({
        success: false,
        totalProcessed: 0,
        totalErrors: 1,
        tableResults: {},
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Migração de Mídia Base64
        </CardTitle>
        <CardDescription>
          Migra todas as mídias em base64 das mensagens para o Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={startMigration}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Iniciar Migração
              </>
            )}
          </Button>

          {isRunning && (
            <div className="flex-1">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">
                Processando... {progress}%
              </p>
            </div>
          )}
        </div>

        {lastResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'Migração Concluída' : 'Erro na Migração'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lastResult.totalProcessed}
                </div>
                <div className="text-sm text-muted-foreground">Processados</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {lastResult.totalErrors}
                </div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>

            {Object.keys(lastResult.tableResults).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Resultados por Tabela:</h4>
                <div className="space-y-1">
                  {Object.entries(lastResult.tableResults).map(([table, result]) => (
                    <div key={table} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{table}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-green-600">
                          {result.processed} ✓
                        </Badge>
                        {result.errors > 0 && (
                          <Badge variant="destructive">
                            {result.errors} ✗
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {lastResult.message}
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>O que esta migração faz:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Encontra todas as mensagens com base64 em todas as tabelas</li>
            <li>Converte o base64 para arquivos no Supabase Storage</li>
            <li>Substitui o base64 pela URL do storage</li>
            <li>Melhora significativamente a performance do sistema</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
