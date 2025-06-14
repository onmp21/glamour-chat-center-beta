import { supabase } from '@/integrations/supabase/client.ts';
import { ReportHistory } from '@/types/ai-providers';
import OpenAI from 'openai';

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
    data: any; // Este 'data' pode precisar ser mais específico ou usado no prompt
    custom_prompt?: string;
  }): Promise<ReportHistory> {
    // Validar se a chave da API está disponível
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ [AI_REPORTS] Chave da API OpenAI não configurada. Verifique VITE_OPENAI_API_KEY.");
      // Criar um relatório de erro imediatamente
      return await this.createReport({
        prompt: params.custom_prompt || `Tentativa de gerar relatório ${params.report_type}`,
        report_type: params.report_type,
        generated_report: "Erro: Chave da API OpenAI não configurada. Contate o administrador.",
        provider_id: params.provider_id,
        model_used: "N/A",
        tokens_used: 0,
        generation_time: 0,
        metadata: { 
          error: "API key missing",
          data_source: params.report_type 
        }
      });
    }
    
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Adicionado para uso no lado do cliente, se for o caso. Idealmente, isso seria no backend.
    });

    let generatedReportContent = "";
    let modelUsed = "gpt-3.5-turbo"; // Modelo padrão
    let tokensUsed = 0;
    let generationTime = 0;
    const startTime = Date.now();

    try {
      console.log("🤖 [AI_REPORTS] Gerando relatório com OpenAI...", { type: params.report_type, provider: params.provider_id });
      
      // Construir o prompt para a OpenAI
      let userPromptContent = `Gere um relatório detalhado sobre ${params.report_type}.`;
      if (params.data && Object.keys(params.data).length > 0) {
        // Simplificar dados se forem muito grandes para o prompt
        const dataString = JSON.stringify(params.data).length > 3000 
          ? "Dados muito extensos para incluir diretamente. Analise o contexto geral." 
          : JSON.stringify(params.data);
        userPromptContent += `\n\nDados fornecidos para análise:\n${dataString}`;
      }
      if (params.custom_prompt) {
        userPromptContent += `\n\nInstruções adicionais (prompt customizado):\n${params.custom_prompt}`;
      }

      const completion = await openai.chat.completions.create({
        messages: [{
          role: "system",
          content: "Você é um assistente analítico especializado em gerar relatórios concisos e informativos baseados nos dados e instruções fornecidas."
        }, {
          role: "user",
          content: userPromptContent
        }],
        model: modelUsed, // Pode ser configurável no futuro
      });

      generatedReportContent = completion.choices[0].message.content || "Não foi possível gerar o conteúdo do relatório.";
      modelUsed = completion.model; // Atualiza com o modelo realmente usado, se diferente
      tokensUsed = completion.usage?.total_tokens || 0;
      console.log("✅ [AI_REPORTS] Relatório gerado pela OpenAI:", { model: modelUsed, tokens: tokensUsed });

    } catch (error: any) {
      console.error("❌ [AI_REPORTS] Erro ao gerar relatório com OpenAI:", error);
      generatedReportContent = `Falha ao gerar relatório: ${error.message || String(error)}`;
      // Se for um erro de autenticação, pode ser mais específico
      if (error.status === 401) {
        generatedReportContent = "Erro de autenticação com a API OpenAI. Verifique a chave da API.";
      }
    } finally {
      generationTime = (Date.now() - startTime) / 1000; // Tempo em segundos
    }

    const report = await this.createReport({
      prompt: params.custom_prompt || `Gerar relatório de ${params.report_type}`,
      report_type: params.report_type,
      generated_report: generatedReportContent,
      provider_id: params.provider_id, // ID do provedor configurado no sistema
      model_used: modelUsed,
      tokens_used: tokensUsed,
      generation_time: generationTime,
      metadata: { 
        data_source: params.report_type,
        ...(params.data && Object.keys(params.data).length > 0 && { data_preview: JSON.stringify(params.data).substring(0, 200) + "..."}) // Preview dos dados
      }
    });

    return report;
  }
}
