
import { supabase } from '@/integrations/supabase/client';
import { ReportHistory } from '@/types/ai-providers';
<<<<<<< HEAD
import OpenAI from 'openai';
=======
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0

export class IntelligentReportsService {
  static async getReports(): Promise<ReportHistory[]> {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select(`
          *,
          ai_providers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }

      return (data || []).map(report => ({
        id: report.id,
        title: report.prompt || 'Relatório',
        prompt: report.prompt,
        generated_at: report.created_at,
        created_at: report.created_at,
        provider_used: (report as any).ai_providers?.name || 'Unknown',
        provider_id: report.provider_id || '',
        provider_name: (report as any).ai_providers?.name || 'Unknown',
        model_used: report.model_used || '',
        tokens_used: report.tokens_used || 0,
        generation_time: Number(report.generation_time) || 0,
        metadata: typeof report.report_metadata === 'object' 
          ? report.report_metadata as Record<string, any> 
          : {},
        query: report.prompt,
        result: {
          id: report.id,
          title: report.prompt || 'Relatório',
          content: report.generated_report,
          created_at: report.created_at,
          provider_id: report.provider_id || '',
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
      console.error('Error in getReports:', error);
      return [];
    }
  }

  static async createReport(reportData: {
    prompt: string;
    report_type: string;
    generated_report: string;
    provider_id?: string;
    model_used?: string;
    tokens_used?: number;
    generation_time?: number;
    metadata?: Record<string, any>;
  }): Promise<ReportHistory> {
    const { data, error } = await supabase
      .from('report_history')
      .insert({
        prompt: reportData.prompt,
        report_type: reportData.report_type,
        generated_report: reportData.generated_report,
        provider_id: reportData.provider_id,
        model_used: reportData.model_used,
        tokens_used: reportData.tokens_used || 0,
        generation_time: reportData.generation_time || 0,
        report_metadata: reportData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.prompt,
      prompt: data.prompt,
      generated_at: data.created_at,
      created_at: data.created_at,
      provider_used: 'Unknown',
      provider_id: data.provider_id || '',
      provider_name: 'Unknown',
      model_used: data.model_used || '',
      tokens_used: data.tokens_used || 0,
      generation_time: Number(data.generation_time) || 0,
      metadata: data.report_metadata as Record<string, any> || {},
      query: data.prompt,
      result: {
        id: data.id,
        title: data.prompt,
        content: data.generated_report,
        created_at: data.created_at,
        provider_id: data.provider_id || '',
        report_content: data.generated_report,
        report_type: data.report_type,
        status: 'completed'
      },
      timestamp: data.created_at,
      status: 'success',
      report_type: data.report_type,
      generated_report: data.generated_report
    };
  }

  static async generateReport(params: {
    provider_id: string;
    report_type: 'conversations' | 'channels' | 'custom';
    data: any;
    custom_prompt?: string;
  }): Promise<ReportHistory> {
<<<<<<< HEAD
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    });

    let generatedReportContent = "";
    let modelUsed = "";
    let tokensUsed = 0;
    let generationTime = 0;

    try {
      const startTime = Date.now();
      const completion = await openai.chat.completions.create({
        messages: [{
          role: "system",
          content: "You are a helpful assistant that generates reports based on provided data."
        }, {
          role: "user",
          content: `Generate a detailed report for ${params.report_type}. Data: ${JSON.stringify(params.data)}. Custom prompt: ${params.custom_prompt || "None"}`
        }],
        model: "gpt-3.5-turbo", // You can make this configurable
      });

      generatedReportContent = completion.choices[0].message.content || "";
      modelUsed = completion.model;
      tokensUsed = completion.usage?.total_tokens || 0;
      generationTime = (Date.now() - startTime) / 1000;

    } catch (error) {
      console.error("Error generating report with OpenAI:", error);
      generatedReportContent = `Failed to generate report: ${error.message || error}`;
    }

    const report = await this.createReport({
      prompt: params.custom_prompt || `Generate ${params.report_type} report`,
      report_type: params.report_type,
      generated_report: generatedReportContent,
      provider_id: params.provider_id,
      model_used: modelUsed,
      tokens_used: tokensUsed,
      generation_time: generationTime,
      metadata: { data_source: params.report_type }
    });

    return report;
=======
    // Mock implementation for now
    const mockReport = await this.createReport({
      prompt: params.custom_prompt || `Generate ${params.report_type} report`,
      report_type: params.report_type,
      generated_report: `Mock report generated for ${params.report_type}`,
      provider_id: params.provider_id,
      model_used: 'mock-model',
      tokens_used: 100,
      generation_time: 2.5,
      metadata: { data_source: params.report_type }
    });

    return mockReport;
>>>>>>> 19c16077c5bade03675ba87810862df6673ed4f0
  }
}
