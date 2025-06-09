import { useState, useCallback } from 'react';
import { EnhancedReportService, ReportData, ReportResult } from '../services/EnhancedReportService';

export function useEnhancedReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  
  const reportService = new EnhancedReportService();

  const generateReport = useCallback(async (reportData: ReportData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reportService.generateReport(reportData);
      setReportResult(result);
      return result;
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError('Falha ao gerar relatório. Por favor, tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateConversationReport = useCallback(async (
    channelId: string,
    sessionId: string,
    period: { start: string; end: string }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reportService.generateConversationReport(channelId, sessionId, period);
      setReportResult(result);
      return result;
    } catch (err) {
      console.error('Erro ao gerar relatório de conversa:', err);
      setError('Falha ao gerar relatório de conversa. Por favor, tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReportResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    reportResult,
    generateReport,
    generateConversationReport,
    clearReport
  };
}

