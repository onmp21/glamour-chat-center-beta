
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  type: 'conversations' | 'channels' | 'custom';
  channelIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  customPrompt?: string;
}

export interface ReportResult {
  id?: string;
  content: string;
  htmlReport: string;
  insights: string;
  recommendations: string[];
  metadata: {
    tokens_used?: number;
    generation_time?: number;
    model_used?: string;
    created_at: string;
  };
}

export class EnhancedReportService {
  async generateReport(reportData: ReportData): Promise<ReportResult> {
    console.log('📊 [ENHANCED_REPORT] Gerando relatório:', reportData);

    try {
      // Chamar a edge function para gerar o relatório
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: 'default', // Usar provider padrão se não especificado
          report_type: reportData.type,
          data: reportData,
          custom_prompt: reportData.customPrompt,
          filters: reportData.filters || {}
        }
      });

      if (error) {
        console.error('❌ [ENHANCED_REPORT] Erro na edge function:', error);
        throw new Error(`Erro ao gerar relatório: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ [ENHANCED_REPORT] Resposta inválida:', data);
        throw new Error('Resposta inválida da edge function');
      }

      console.log('✅ [ENHANCED_REPORT] Relatório gerado com sucesso');

      return {
        id: data.metadata?.report_id,
        content: data.report,
        htmlReport: data.report, // Use the same content for HTML
        insights: data.insights || 'Nenhum insight disponível',
        recommendations: data.recommendations || ['Nenhuma recomendação disponível'],
        metadata: {
          tokens_used: data.metadata?.tokens_used,
          generation_time: data.metadata?.generation_time,
          model_used: data.metadata?.model_used,
          created_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ [ENHANCED_REPORT] Erro:', error);
      throw error;
    }
  }

  async generateConversationReport(
    channelId: string, 
    sessionId: string, 
    period: { start: string; end: string }
  ): Promise<ReportResult> {
    return this.generateReport({
      type: 'conversations',
      channelIds: [channelId],
      dateRange: period,
      customPrompt: `Gere um relatório detalhado sobre a conversa ${sessionId} no canal ${channelId} no período de ${period.start} a ${period.end}`
    });
  }

  async getReportHistory(): Promise<ReportResult[]> {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [ENHANCED_REPORT] Erro ao buscar histórico:', error);
        return [];
      }

      return data.map(report => ({
        id: report.id,
        content: report.generated_report,
        htmlReport: report.generated_report, // Use same content for HTML
        insights: 'Insights não disponíveis para relatórios antigos',
        recommendations: ['Recomendações não disponíveis para relatórios antigos'],
        metadata: {
          tokens_used: report.tokens_used,
          generation_time: report.generation_time,
          model_used: report.model_used,
          created_at: report.created_at
        }
      }));

    } catch (error) {
      console.error('❌ [ENHANCED_REPORT] Erro ao buscar histórico:', error);
      return [];
    }
  }
}
