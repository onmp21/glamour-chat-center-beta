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
  report_type: string;
  status: string;
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
      
      // Verificar se há pelo menos uma conversa nos dados
      const totalRecords = Object.values(allData).reduce((sum, records) => sum + records.length, 0);
      if (totalRecords === 0 && selectedSheets.length > 0) {
        throw new Error('Nenhum dado encontrado nas tabelas selecionadas. Certifique-se de que há pelo menos uma conversa ou registro.');
      }
      
      return allData;
    } catch (error) {
      console.error('❌ [INTELLIGENT_REPORTS] Erro ao buscar dados:', error);
      throw error;
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

      const startTime = Date.now();

      // Fazer chamada para a edge function com dados reais
      const { data: aiResult, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: request.provider_id,
          report_type: request.report_type,
          custom_prompt: request.custom_prompt,
          selected_sheets: request.selected_sheets || [],
          table_data: reportData // Enviando dados reais das tabelas
        }
      });

      if (error) {
        console.error('❌ [INTELLIGENT_REPORTS] Erro na edge function:', error);
        return { success: false, error: `Erro na API: ${error.message}` };
      }

      if (!aiResult || !aiResult.success) {
        return { success: false, error: aiResult?.error || 'Erro desconhecido na geração do relatório' };
      }

      const generationTime = (Date.now() - startTime) / 1000;

      // Buscar o relatório salvo no histórico (a edge function já salva automaticamente)
      const { data: savedReports, error: fetchError } = await supabase
        .from('report_history')
        .select('*')
        .eq('provider_id', request.provider_id)
        .eq('report_type', request.report_type)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !savedReports || savedReports.length === 0) {
        console.error('❌ [INTELLIGENT_REPORTS] Erro ao buscar relatório salvo:', fetchError);
        // Criar resultado sem ID se não conseguir buscar do histórico
        return {
          success: true,
          result: {
            id: 'temp-' + Date.now(),
            title: `Relatório ${request.report_type}`,
            content: aiResult.report,
            provider_id: request.provider_id,
            report_content: aiResult.report,
            generated_report: aiResult.report,
            model_used: aiResult.model_used || provider.default_model,
            tokens_used: aiResult.tokens_used || 0,
            generation_time: generationTime,
            created_at: new Date().toISOString(),
            generated_at: new Date().toISOString(),
            report_type: request.report_type,
            status: 'completed'
          }
        };
      }

      const savedReport = savedReports[0];

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
          generated_at: savedReport.created_at,
          report_type: savedReport.report_type,
          status: 'completed'
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

  static async deleteReport(reportId: string): Promise<void> {
    try {
      console.log('🗑️ [INTELLIGENT_REPORTS] Removendo relatório:', reportId);
      
      const { error } = await supabase
        .from('report_history')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('❌ [INTELLIGENT_REPORTS] Erro ao remover relatório:', error);
        throw error;
      }

      console.log('✅ [INTELLIGENT_REPORTS] Relatório removido com sucesso');
    } catch (error) {
      console.error('❌ [INTELLIGENT_REPORTS] Erro inesperado ao remover relatório:', error);
      throw error;
    }
  }
}
