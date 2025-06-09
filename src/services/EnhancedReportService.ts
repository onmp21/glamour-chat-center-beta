
import { supabase } from '../integrations/supabase/client';
import { ChatGPTService, createChatGPTService } from './ChatGPTService';

export interface ReportData {
  type: string;
  title: string;
  period: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  data: any[];
}

export interface ReportResult {
  report: string;
  htmlReport: string;
  insights: string;
  recommendations: string[];
  charts?: any[];
}

export class EnhancedReportService {
  private chatGPTService: ChatGPTService | null;

  constructor() {
    this.chatGPTService = createChatGPTService();
  }

  async generateReport(reportData: ReportData): Promise<ReportResult> {
    try {
      // Preparar os dados para o prompt
      const dataString = JSON.stringify(reportData.data.slice(0, 30), null, 2);
      const periodStr = `${new Date(reportData.period.start).toLocaleDateString('pt-BR')} a ${new Date(reportData.period.end).toLocaleDateString('pt-BR')}`;
      
      // Construir o prompt para o relatório
      const prompt = `
        Gere um relatório detalhado sobre ${reportData.title} para o período de ${periodStr}.
        
        Tipo de relatório: ${reportData.type}
        
        Dados para análise:
        ${dataString}
        
        ${reportData.filters ? `Filtros aplicados: ${JSON.stringify(reportData.filters, null, 2)}` : ''}
        
        Inclua:
        1. Análise detalhada dos dados
        2. Tendências identificadas
        3. Comparações relevantes
        4. Métricas importantes
        5. Recomendações práticas
      `;

      // Chamar a função Supabase para gerar o relatório
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { prompt }
      });

      if (error) {
        throw new Error(`Erro ao gerar relatório: ${error.message}`);
      }

      // Gerar insights adicionais usando o ChatGPT Service
      let insights = '';
      let recommendations: string[] = [];

      if (this.chatGPTService) {
        try {
          insights = await this.chatGPTService.generateReportInsights(
            reportData.data,
            reportData.type
          );
          
          recommendations = await this.chatGPTService.generatePerformanceRecommendations({
            reportType: reportData.type,
            period: reportData.period,
            dataSize: reportData.data.length,
            summary: data.report.substring(0, 500) // Primeiros 500 caracteres do relatório
          });
        } catch (insightError) {
          console.error('Erro ao gerar insights:', insightError);
          insights = 'Não foi possível gerar insights adicionais.';
          recommendations = ['Não foi possível gerar recomendações específicas.'];
        }
      }

      return {
        report: data.report,
        htmlReport: data.htmlReport,
        insights,
        recommendations
      };
    } catch (error) {
      console.error('Erro no serviço de relatórios:', error);
      throw error;
    }
  }

  async generateConversationReport(
    channelId: string,
    sessionId: string,
    period: { start: string; end: string }
  ): Promise<ReportResult> {
    try {
      // Obter dados da conversa
      const { data: conversationData, error: conversationError } = await this.getConversationData(
        channelId,
        sessionId,
        period
      );

      if (conversationError) {
        throw new Error(`Erro ao obter dados da conversa: ${conversationError.message}`);
      }

      // Obter informações do contato
      const { data: contactData, error: contactError } = await this.getContactInfo(
        channelId,
        sessionId
      );

      if (contactError) {
        console.warn(`Aviso ao obter informações do contato: ${contactError.message}`);
      }

      // Safely extract contact name with proper type checking
      let contactName = sessionId; // fallback
      if (contactData && typeof contactData === 'object') {
        const data = contactData as any;
        contactName = data.nome_do_contato || data.Nome_do_contato || sessionId;
      }

      const channelName = await this.getChannelName(channelId);

      // Preparar os dados para o prompt
      const conversationString = (conversationData || [])
        .filter(msg => msg && typeof msg === 'object')
        .map((msg: any) => {
          const sender = msg.tipo_remetente === 'USUARIO_INTERNO' || msg.tipo_remetente === 'Yelena-ai' 
            ? 'Atendente' 
            : contactName;
          const timestamp = new Date(msg.read_at || msg.timestamp || Date.now()).toLocaleString('pt-BR');
          const content = msg.message || msg.content || '';
          return `[${timestamp}] ${sender}: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`;
        })
        .join('\n');

      const periodStr = `${new Date(period.start).toLocaleDateString('pt-BR')} a ${new Date(period.end).toLocaleDateString('pt-BR')}`;
      
      // Construir o prompt para o relatório
      const prompt = `
        Gere um relatório detalhado sobre a conversa com o cliente ${contactName} no canal ${channelName} 
        para o período de ${periodStr}.
        
        Conversa:
        ${conversationString}
        
        Inclua:
        1. Resumo da conversa
        2. Principais assuntos discutidos
        3. Problemas identificados
        4. Soluções propostas
        5. Análise de sentimento do cliente
        6. Recomendações para melhorar o atendimento
      `;

      // Chamar a função Supabase para gerar o relatório
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { prompt }
      });

      if (error) {
        throw new Error(`Erro ao gerar relatório: ${error.message}`);
      }

      // Gerar insights adicionais usando o ChatGPT Service
      let insights = '';
      let recommendations: string[] = [];

      if (this.chatGPTService && conversationData) {
        try {
          // Extrair apenas o conteúdo das mensagens para análise
          const messageContents = conversationData
            .filter(msg => msg && typeof msg === 'object')
            .map((msg: any) => msg.message || msg.content || '')
            .filter(content => content.length > 0);
          
          if (messageContents.length > 0) {
            // Analisar sentimento
            const sentimentResult = await this.chatGPTService.analyzeSentiment(messageContents);
            
            insights = `Análise de Sentimento: ${this.translateSentiment(sentimentResult.sentiment)} (confiança: ${Math.round(sentimentResult.confidence * 100)}%)\n\n`;
            
            // Gerar insights adicionais
            const additionalInsights = await this.chatGPTService.generateReportInsights(
              conversationData,
              'conversa com cliente'
            );
            
            insights += additionalInsights;
            
            // Gerar recomendações
            recommendations = await this.chatGPTService.generatePerformanceRecommendations({
              contactName,
              channelName,
              messageCount: conversationData.length,
              sentiment: sentimentResult.sentiment,
              period
            });
          }
        } catch (insightError) {
          console.error('Erro ao gerar insights:', insightError);
          insights = 'Não foi possível gerar insights adicionais.';
          recommendations = ['Não foi possível gerar recomendações específicas.'];
        }
      }

      return {
        report: data.report,
        htmlReport: data.htmlReport,
        insights,
        recommendations
      };
    } catch (error) {
      console.error('Erro no serviço de relatórios de conversa:', error);
      throw error;
    }
  }

  private async getConversationData(
    channelId: string,
    sessionId: string,
    period: { start: string; end: string }
  ) {
    // Determinar a tabela com base no channelId
    const tableName = this.getTableNameForChannel(channelId);
    
    // Determinar os campos com base na tabela
    const timestampField = 'read_at';
    
    // Consultar os dados da conversa
    return await supabase
      .from(tableName as any)
      .select('*')
      .eq('session_id', sessionId)
      .gte(timestampField, period.start)
      .lte(timestampField, period.end)
      .order(timestampField, { ascending: true });
  }

  private async getContactInfo(channelId: string, sessionId: string) {
    const tableName = this.getTableNameForChannel(channelId);
    
    return await supabase
      .from(tableName as any)
      .select('*')
      .eq('session_id', sessionId)
      .eq('tipo_remetente', 'CONTATO_EXTERNO')
      .limit(1)
      .maybeSingle();
  }

  private getTableNameForChannel(channelId: string): string {
    // Mapeamento de channelId para nome da tabela
    const channelTableMap: Record<string, string> = {
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas', // Yelena
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas', // Andressa
      'gustavo': 'gerente_lojas_conversas', // Gustavo
      'canarana': 'canarana_conversas', // Canarana
      'souto-soares': 'souto_soares_conversas', // Souto Soares
      'joao-dourado': 'joao_dourado_conversas', // João Dourado
      'america-dourada': 'america_dourada_conversas', // América Dourada
    };
    
    return channelTableMap[channelId] || 'yelena_ai_conversas';
  }

  private async getChannelName(channelId: string): Promise<string> {
    // Mapeamento de channelId para nome do canal
    const channelNameMap: Record<string, string> = {
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Yelena-AI',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'Andressa Gerente Externo',
      'gustavo': 'Gustavo Gerente das Lojas',
      'canarana': 'Canarana',
      'souto-soares': 'Souto Soares',
      'joao-dourado': 'João Dourado',
      'america-dourada': 'América Dourada',
    };
    
    // Tentar obter o nome do canal do mapeamento
    if (channelNameMap[channelId]) {
      return channelNameMap[channelId];
    }
    
    // Se não encontrado no mapeamento, tentar buscar do banco de dados
    try {
      const { data } = await supabase
        .from('channels')
        .select('name')
        .eq('id', channelId)
        .maybeSingle();
      
      return data?.name || 'Canal Desconhecido';
    } catch (error) {
      console.error('Erro ao obter nome do canal:', error);
      return 'Canal Desconhecido';
    }
  }

  private translateSentiment(sentiment: string): string {
    const translations: Record<string, string> = {
      'positive': 'Positivo',
      'neutral': 'Neutro',
      'negative': 'Negativo'
    };
    
    return translations[sentiment] || sentiment;
  }
}
