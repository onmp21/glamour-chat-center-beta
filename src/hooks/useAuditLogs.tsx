
import { useState, useEffect } from 'react';
import { AuditService } from '@/services/AuditService';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async (page = 0, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [AUDIT_HOOK] Loading logs...');
      
      const auditService = AuditService.getInstance();
      const data = await auditService.getLogs(page, limit);

      // Converter os dados para o tipo correto
      const formattedLogs: AuditLog[] = data.map(log => ({
        ...log,
        ip_address: log.ip_address ? String(log.ip_address) : null
      }));

      setLogs(formattedLogs);
      console.log(`✅ [AUDIT_HOOK] Loaded ${formattedLogs.length} logs`);
    } catch (err) {
      console.error('❌ [AUDIT_HOOK] Error loading logs:', err);
      setError('Erro inesperado ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    return loadLogs();
  };

  const createAuditLog = async (logData: {
    user_name: string;
    action: string;
    resource_type: string;
    user_id?: string;
    resource_id?: string;
    details?: any;
  }) => {
    try {
      const auditService = AuditService.getInstance();
      await auditService.createLog({
        action: logData.action,
        resourceType: logData.resource_type,
        resourceId: logData.resource_id || '',
        details: logData.details,
        userId: logData.user_id || '',
        userName: logData.user_name
      });

      console.log('✅ [AUDIT_HOOK] Log de auditoria criado:', logData);
      
      // Recarregar logs após criar um novo
      setTimeout(() => {
        loadLogs();
      }, 1000);
    } catch (err) {
      console.error('❌ [AUDIT_HOOK] Erro ao criar log de auditoria:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return {
    logs,
    loading,
    error,
    loadLogs,
    refetch,
    createAuditLog
  };
};
