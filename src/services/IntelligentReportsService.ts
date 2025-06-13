
import { supabase } from '@/integrations/supabase/client';
import { ReportHistory } from '@/types/ai-providers';

export class IntelligentReportsService {
  static async generateReport(params: {
    provider_id: string;
    report_type: 'conversations' | 'channels' | 'custom';
    data: any;
    custom_prompt?: string;
  }) {
    try {
      const reportId = crypto.randomUUID();
      const reportContent = `Generated report for ${params.report_type} using provider ${params.provider_id}`;
      
      const { data, error } = await supabase
        .from('report_history')
        .insert({
          id: reportId,
          prompt: params.custom_prompt || `${params.report_type} analysis`,
          report_type: params.report_type,
          generated_report: reportContent,
          provider_id: params.provider_id,
          model_used: 'mock-model',
          tokens_used: 100,
          generation_time: 2.5
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: reportId,
        title: `${params.report_type} Report`,
        content: reportContent,
        created_at: new Date().toISOString(),
        provider_id: params.provider_id,
        report_content: reportContent,
        report_type: params.report_type,
        status: 'completed'
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  static async getReports(): Promise<ReportHistory[]> {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select(`
          *,
          ai_providers (
            name,
            provider_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(report => ({
        id: report.id,
        title: 'Report',
        prompt: report.prompt,
        generated_at: report.created_at,
        created_at: report.created_at,
        provider_used: report.ai_providers?.name || 'Unknown',
        provider_id: report.provider_id,
        provider_name: report.ai_providers?.name || 'Unknown',
        model_used: report.model_used || 'unknown',
        tokens_used: report.tokens_used || 0,
        generation_time: report.generation_time || 0,
        metadata: typeof report.report_metadata === 'object' ? report.report_metadata as Record<string, any> : {},
        query: report.prompt,
        result: {
          id: report.id,
          title: 'Report',
          content: report.generated_report,
          created_at: report.created_at,
          provider_id: report.provider_id,
          report_content: report.generated_report,
          report_type: report.report_type,
          status: 'completed'
        },
        timestamp: report.created_at,
        status: 'success',
        report_type: report.report_type,
        generated_report: report.generated_report
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }
}
