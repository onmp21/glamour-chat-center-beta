
import { supabase } from '@/integrations/supabase/client';
import { AIProviderService } from './AIProviderService';

export interface ReportGenerationRequest {
  provider_id: string;
  report_type: string;
  data?: any;
  custom_prompt?: string;
  selected_sheets?: string[];
}

export interface ReportResult {
  id: string;
  title: string;
  content: string;
  provider_id: string;
  report_content: string;
  generated_report: string;
  model_used: string | null;
  tokens_used: number | null;
  generation_time: number | null;
  created_at: string;
  generated_at: string;
}

export interface ReportHistory {
  id: string;
  title: string;
  generated_at: string;
  provider_used: string;
  provider_id: string;
  report_type: string;
  generated_report: string;
  model_used: string | null;
  tokens_used: number | null;
  generation_time: number | null;
  created_at: string;
  prompt: string;
  report_metadata: any;
}

export class IntelligentReportsService {
  
  // Função para buscar dados reais das planilhas selecionadas
  static async fetchReportData(reportType: string, selectedSheets: string[] = []): Promise<any> {
    console.log('📊 [INTELLIGENT_REPORTS] Buscando dados para relatório:', { reportType, selectedSheets });
    
    try {
      const allData: Record<string, any[]> = {};
      
      for (const tableName of selectedSheets) {
        console.log(`🔍 [INTELLIGENT_REPORTS] Buscando dados da tabela: ${tableName}`);
        
        let query;
        if (tableName === 'exams') {
          query = supabase
            .from('exams')
            .select('*')
            .limit(50)
            .order('appointment_date', { ascending: false });
        } else {
          // Tabelas de conversas
          query = supabase
            .from(tableName as any)
            .select('session_id, message, nome_do_contato, tipo_remetente, read_at, mensagemtype')
            .limit(100)
            .order('read_at', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error(`❌ [INTELLIGENT_REPORTS] Erro ao buscar dados de ${tableName}:`, error);
          continue;
        }
        
        allData[tableName] = data || [];
        console.log(`✅ [INTELLIGENT_REPORTS] ${data?.length || 0} registros encontrados em ${tableName}`);
      }
      
      return allData;
    } catch (error) {
      console.error('❌ [INTELLIGENT_REPORTS] Erro ao buscar dados:', error);
      return {};
    }
  }

  static async generateReport(request: ReportGenerationRequest): Promise<{ success: boolean; result?: ReportResult; error?: string }> {
    console.log('🚀 [INTELLIGENT_REPORTS] Iniciando geração de relatório:', request);
    
    try {
      // Buscar dados das planilhas selecionadas
      let reportData = {};
      if (request.selected_sheets && request.selected_sheets.length > 0) {
        reportData = await this.fetchReportData(request.report_type, request.selected_sheets);
      }

      // Buscar provedor de IA
      const provider = await AIProviderService.getProviderById(request.provider_id);
      if (!provider) {
        return { success: false, error: 'Provedor de IA não encontrado' };
      }

      // Construir prompt baseado no tipo de relatório
      let prompt = '';
      if (request.report_type === 'conversations') {
        prompt = `Analise as conversas fornecidas e gere um relatório detalhado com insights sobre:
- Volume de mensagens
- Padrões de comunicação
- Tipos de conteúdo mais frequentes
- Tendências temporais
- Recomendações de melhoria

Dados das conversas: ${JSON.stringify(reportData, null, 2)}`;
      } else if (request.report_type === 'exams') {
        prompt = `Analise os dados de exames fornecidos e gere um relatório com:
- Estatísticas de agendamentos
- Distribuição por cidade
- Análise temporal
- Status dos exames
- Insights e recomendações

Dados dos exames: ${JSON.stringify(reportData, null, 2)}`;
      } else if (request.report_type === 'custom') {
        prompt = request.custom_prompt || 'Gere um relatório com base nos dados fornecidos.';
        if (Object.keys(reportData).length > 0) {
          prompt += `\n\nDados disponíveis: ${JSON.stringify(reportData, null, 2)}`;
        }
      }

      const startTime = Date.now();

      // Fazer chamada para IA
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id: request.provider_id,
          prompt: prompt
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Erro na API: ${errorText}` };
      }

      const aiResult = await response.json();
      const generationTime = (Date.now() - startTime) / 1000;

      // Salvar no histórico
      const { data: savedReport, error: saveError } = await supabase
        .from('report_history')
        .insert({
          provider_id: request.provider_id,
          report_type: request.report_type,
          prompt: prompt,
          generated_report: aiResult.content,
          model_used: aiResult.model || provider.default_model,
          tokens_used: aiResult.tokens || 0,
          generation_time: generationTime,
          report_metadata: {
            selected_sheets: request.selected_sheets,
            data_summary: Object.keys(reportData).map(table => ({
              table,
              count: reportData[table]?.length || 0
            }))
          }
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ [INTELLIGENT_REPORTS] Erro ao salvar relatório:', saveError);
        return { success: false, error: 'Erro ao salvar relatório' };
      }

      console.log('✅ [INTELLIGENT_REPORTS] Relatório gerado com sucesso:', savedReport.id);
      
      return {
        success: true,
        result: {
          id: savedReport.id,
          title: `Relatório ${request.report_type}`,
          content: savedReport.generated_report,
          provider_id: savedReport.provider_id,
          report_content: savedReport.generated_report,
          generated_report: savedReport.generated_report,
          model_used: savedReport.model_used,
          tokens_used: savedReport.tokens_used,
          generation_time: savedReport.generation_time,
          created_at: savedReport.created_at,
          generated_at: savedReport.created_at
        }
      };

    } catch (error) {
      console.error('❌ [INTELLIGENT_REPORTS] Erro na geração:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  static async getReports(): Promise<ReportHistory[]> {
    try {
      console.log('📋 [INTELLIGENT_REPORTS] Carregando histórico de relatórios...');
      
      const { data, error } = await supabase
        .from('report_history')
        .select(`
          *,
          ai_providers!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ [INTELLIGENT_REPORTS] Erro ao carregar relatórios:', error);
        throw error;
      }

      console.log('✅ [INTELLIGENT_REPORTS] Relatórios carregados:', data?.length || 0);
      
      return (data || []).map(report => ({
        id: report.id,
        title: `Relatório ${report.report_type}`,
        generated_at: report.created_at,
        provider_used: report.ai_providers?.name || 'Desconhecido',
        provider_id: report.provider_id,
        report_type: report.report_type,
        generated_report: report.generated_report,
        model_used: report.model_used,
        tokens_used: report.tokens_used,
        generation_time: report.generation_time,
        created_at: report.created_at,
        prompt: report.prompt,
        report_metadata: report.report_metadata
      }));
    } catch (error) {
      console.error('❌ [INTELLIGENT_REPORTS] Erro inesperado:', error);
      throw error;
    }
  }
}
