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

export class EnhancedReportServiceV2 {
  private chatGPTService: ChatGPTService | null;

  constructor() {
    this.chatGPTService = createChatGPTService();
  }

  async generateReport(reportData: ReportData): Promise<ReportResult> {
    try {
      console.log('🚀 [ENHANCED_REPORT_SERVICE_V2] Iniciando geração de relatório:', reportData.title);
      
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
        
        Formate o relatório com títulos, subtítulos e listas para facilitar a leitura.
      `;

      // Chamar a função Supabase para gerar o relatório
      console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Chamando função Supabase para gerar relatório');
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { prompt }
      });

      if (error) {
        console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro ao chamar função Supabase:', error);
        throw new Error(`Erro ao gerar relatório: ${error.message}`);
      }

      console.log('✅ [ENHANCED_REPORT_SERVICE_V2] Relatório gerado com sucesso pela função Supabase');

      // Gerar insights adicionais usando o ChatGPT Service
      let insights = '';
      let recommendations: string[] = [];

      if (this.chatGPTService) {
        try {
          console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Gerando insights adicionais com ChatGPT');
          
          insights = await this.chatGPTService.generateReportInsights(
            reportData.data,
            reportData.type
          );
          
          console.log('✅ [ENHANCED_REPORT_SERVICE_V2] Insights gerados com sucesso');
          console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Gerando recomendações com ChatGPT');
          
          recommendations = await this.chatGPTService.generatePerformanceRecommendations({
            reportType: reportData.type,
            period: reportData.period,
            dataSize: reportData.data.length,
            summary: data.report.substring(0, 500) // Primeiros 500 caracteres do relatório
          });
          
          console.log('✅ [ENHANCED_REPORT_SERVICE_V2] Recomendações geradas com sucesso');
        } catch (insightError) {
          console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro ao gerar insights:', insightError);
          insights = 'Não foi possível gerar insights adicionais.';
          recommendations = ['Não foi possível gerar recomendações específicas.'];
        }
      } else {
        console.warn('⚠️ [ENHANCED_REPORT_SERVICE_V2] ChatGPT Service não disponível');
        insights = 'Serviço de IA não configurado. Configure a API key da OpenAI para obter insights adicionais.';
        recommendations = ['Configure a API key da OpenAI para obter recomendações específicas.'];
      }

      return {
        report: data.report,
        htmlReport: data.htmlReport || this.convertToHtml(data.report),
        insights,
        recommendations
      };
    } catch (error) {
      console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro no serviço de relatórios:', error);
      throw error;
    }
  }

  async generateConversationReport(
    channelId: string,
    sessionId: string,
    period: { start: string; end: string }
  ): Promise<ReportResult> {
    try {
      console.log('🚀 [ENHANCED_REPORT_SERVICE_V2] Iniciando geração de relatório de conversa:', {
        channelId,
        sessionId,
        period
      });
      
      // Obter dados da conversa
      console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Obtendo dados da conversa');
      
      const { data: conversationData, error: conversationError } = await this.getConversationData(
        channelId,
        sessionId,
        period
      );

      if (conversationError) {
        console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro ao obter dados da conversa:', conversationError);
        throw new Error(`Erro ao obter dados da conversa: ${conversationError.message}`);
      }

      console.log(`✅ [ENHANCED_REPORT_SERVICE_V2] Obtidos ${conversationData?.length || 0} registros de conversa`);

      // Obter informações do contato
      console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Obtendo informações do contato');
      
      const { data: contactData, error: contactError } = await this.getContactInfo(
        channelId,
        sessionId
      );

      if (contactError) {
        console.warn('⚠️ [ENHANCED_REPORT_SERVICE_V2] Aviso ao obter informações do contato:', contactError);
      }

      // Safely extract contact name with proper type checking
      let contactName = sessionId; // fallback
      if (contactData && typeof contactData === 'object') {
        const data = contactData as any;
        contactName = data.nome_do_contato || data.Nome_do_contato || data.nome || data.name || sessionId;
      }

      console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Obtendo nome do canal');
      const channelName = await this.getChannelName(channelId);
      console.log(`✅ [ENHANCED_REPORT_SERVICE_V2] Nome do canal: ${channelName}`);

      // Preparar os dados para o prompt
      const conversationString = (conversationData || [])
        .filter(msg => msg && typeof msg === 'object')
        .map((msg: any) => {
          const sender = msg.tipo_remetente === 'USUARIO_INTERNO' || 
                         msg.tipo_remetente === 'Yelena-ai' || 
                         msg.sender === 'agent' || 
                         msg.is_from_me === true
            ? 'Atendente' 
            : contactName;
          
          const timestamp = new Date(msg.read_at || msg.timestamp || msg.created_at || Date.now()).toLocaleString('pt-BR');
          const content = msg.message || msg.content || msg.text || '';
          
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
        
        Formate o relatório com títulos, subtítulos e listas para facilitar a leitura.
      `;

      // Chamar a função Supabase para gerar o relatório
      console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Chamando função Supabase para gerar relatório de conversa');
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { prompt }
      });

      if (error) {
        console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro ao chamar função Supabase:', error);
        throw new Error(`Erro ao gerar relatório: ${error.message}`);
      }

      console.log('✅ [ENHANCED_REPORT_SERVICE_V2] Relatório de conversa gerado com sucesso pela função Supabase');

      // Gerar insights adicionais usando o ChatGPT Service
      let insights = '';
      let recommendations: string[] = [];

      if (this.chatGPTService && conversationData) {
        try {
          console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Gerando insights adicionais para conversa');
          
          // Extrair apenas o conteúdo das mensagens para análise
          const messageContents = conversationData
            .filter(msg => msg && typeof msg === 'object')
            .map((msg: any) => msg.message || msg.content || msg.text || '')
            .filter(content => content.length > 0);
          
          if (messageContents.length > 0) {
            // Analisar sentimento
            console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Analisando sentimento da conversa');
            
            const sentimentResult = await this.chatGPTService.analyzeSentiment(messageContents);
            
            insights = `Análise de Sentimento: ${this.translateSentiment(sentimentResult.sentiment)} (confiança: ${Math.round(sentimentResult.confidence * 100)}%)\n\n`;
            
            console.log(`✅ [ENHANCED_REPORT_SERVICE_V2] Sentimento: ${sentimentResult.sentiment}, Confiança: ${sentimentResult.confidence}`);
            
            // Gerar insights adicionais
            console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Gerando insights adicionais para conversa');
            
            const additionalInsights = await this.chatGPTService.generateReportInsights(
              conversationData,
              'conversa com cliente'
            );
            
            insights += additionalInsights;
            
            console.log('✅ [ENHANCED_REPORT_SERVICE_V2] Insights adicionais gerados com sucesso');
            
            // Gerar recomendações
            console.log('🔄 [ENHANCED_REPORT_SERVICE_V2] Gerando recomendações para conversa');
            
            recommendations = await this.chatGPTService.generatePerformanceRecommendations({
              contactName,
              channelName,
              messageCount: conversationData.length,
              sentiment: sentimentResult.sentiment,
              period
            });
            
            console.log('✅ [ENHANCED_REPORT_SERVICE_V2] Recomendações geradas com sucesso');
          } else {
            console.warn('⚠️ [ENHANCED_REPORT_SERVICE_V2] Nenhuma mensagem encontrada para análise');
            insights = 'Não há mensagens suficientes para análise.';
            recommendations = ['Não há dados suficientes para gerar recomendações.'];
          }
        } catch (insightError) {
          console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro ao gerar insights:', insightError);
          insights = 'Não foi possível gerar insights adicionais.';
          recommendations = ['Não foi possível gerar recomendações específicas.'];
        }
      } else {
        console.warn('⚠️ [ENHANCED_REPORT_SERVICE_V2] ChatGPT Service não disponível ou sem dados de conversa');
        insights = 'Serviço de IA não configurado ou sem dados suficientes.';
        recommendations = ['Configure a API key da OpenAI para obter recomendações específicas.'];
      }

      return {
        report: data.report,
        htmlReport: data.htmlReport || this.convertToHtml(data.report),
        insights,
        recommendations
      };
    } catch (error) {
      console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro no serviço de relatórios de conversa:', error);
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
    const timestampField = this.getTimestampFieldForTable(tableName);
    
    console.log(`🔍 [ENHANCED_REPORT_SERVICE_V2] Consultando tabela ${tableName} com campo de timestamp ${timestampField}`);
    
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
    
    console.log(`🔍 [ENHANCED_REPORT_SERVICE_V2] Consultando informações de contato na tabela ${tableName}`);
    
    // Tentar diferentes abordagens para encontrar informações de contato
    const queries = [
      // Abordagem 1: Procurar por tipo_remetente = CONTATO_EXTERNO
      supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .eq('tipo_remetente', 'CONTATO_EXTERNO')
        .limit(1)
        .maybeSingle(),
      
      // Abordagem 2: Procurar por sender = customer
      supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .eq('sender', 'customer')
        .limit(1)
        .maybeSingle(),
      
      // Abordagem 3: Procurar por is_from_me = false
      supabase
        .from(tableName as any)
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_from_me', false)
        .limit(1)
        .maybeSingle()
    ];
    
    // Executar as consultas em paralelo
    const results = await Promise.all(queries);
    
    // Encontrar o primeiro resultado válido
    for (const result of results) {
      if (!result.error && result.data) {
        return result;
      }
    }
    
    // Se nenhum resultado for encontrado, retornar o primeiro resultado (mesmo com erro)
    return results[0];
  }

  private getTableNameForChannel(channelId: string): string {
    // Mapeamento de channelId para nome da tabela
    const channelTableMap: Record<string, string> = {
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas', // Yelena
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas', // Andressa
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas', // Gustavo
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas', // Canarana
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas', // Souto Soares
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas', // João Dourado
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas', // América Dourada
      
      // Nomes alternativos
      'glamour': 'yelena_ai_conversas',
      'andressa': 'gerente_externo_conversas',
      'gustavo': 'gerente_lojas_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
    };
    
    return channelTableMap[channelId] || 'yelena_ai_conversas';
  }

  private getTimestampFieldForTable(tableName: string): string {
    // Mapeamento de tabela para campo de timestamp
    const tableTimestampMap: Record<string, string> = {
      'yelena_ai_conversas': 'read_at',
      'gerente_externo_conversas': 'read_at',
      'gerente_lojas_conversas': 'read_at',
      'canarana_conversas': 'read_at',
      'souto_soares_conversas': 'read_at',
      'joao_dourado_conversas': 'read_at',
      'america_dourada_conversas': 'read_at',
    };
    
    return tableTimestampMap[tableName] || 'read_at';
  }

  private async getChannelName(channelId: string): Promise<string> {
    // Mapeamento de channelId para nome do canal
    const channelNameMap: Record<string, string> = {
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'Yelena-AI',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'Andressa Gerente Externo',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'Gustavo Gerente das Lojas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'Canarana',
      'b7996f75-41a7-4725-8229-564f31868027': 'Souto Soares',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'João Dourado',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'América Dourada',
      
      // Nomes alternativos
      'glamour': 'Yelena-AI',
      'andressa': 'Andressa Gerente Externo',
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
      console.error('❌ [ENHANCED_REPORT_SERVICE_V2] Erro ao obter nome do canal:', error);
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

  private convertToHtml(markdownText: string): string {
    // Conversão simples de markdown para HTML
    let html = '<div class="report-container">';
    
    // Converter cabeçalhos
    html += markdownText
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    
    // Converter parágrafos
    html = html.replace(/^(?!<h[1-6]>)(.*$)/gm, '<p>$1</p>');
    
    // Converter listas
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^[0-9]+\. (.*$)/gm, '<li>$1</li>');
    
    // Agrupar itens de lista
    html = html.replace(/<li>.*<\/li>\n<li>.*<\/li>/gm, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    // Converter negrito e itálico
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    html += '</div>';
    
    // Adicionar estilos CSS
    html = `
      <style>
        .report-container {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #2c3e50;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }
        h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }
        p {
          margin-bottom: 16px;
        }
        ul {
          margin-bottom: 16px;
          padding-left: 2em;
        }
        li {
          margin-bottom: 8px;
        }
        strong {
          font-weight: 600;
        }
      </style>
      ${html}
    `;
    
    return html;
  }
}

