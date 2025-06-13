
import { useState, useEffect } from 'react';
import { IntelligentReportsService } from '@/services/IntelligentReportsService';

interface GenerateReportParams {
  provider_id: string;
  report_type: 'conversations' | 'channels' | 'custom';
  data: any;
  custom_prompt?: string;
}

export const useIntelligentReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await IntelligentReportsService.getReports();
      setReports(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (params: GenerateReportParams) => {
    try {
      setGenerating(true);
      const result = await IntelligentReportsService.generateReport(params);
      await loadReports(); // Reload reports after generating
      return result;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return {
    reports,
    loading,
    generating,
    generateReport,
    refreshReports: loadReports
  };
};
