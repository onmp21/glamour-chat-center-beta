import React from 'react';

// Serviço para integração com a API do ChatGPT
export interface ChatGPTConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationSummaryRequest {
  messages: Array<{
    content: string;
    timestamp: string;
    sender: string;
    isAgent: boolean;
  }>;
  channelName: string;
  contactName: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ConversationSummaryResponse {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  actionItems: string[];
  customerSatisfaction: number; // 1-10
}

export class ChatGPTService {
  private config: ChatGPTConfig;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(config: ChatGPTConfig) {
    this.config = {
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      ...config
    };
  }

  // Método principal para fazer chamadas à API do ChatGPT
  private async callChatGPT(messages: ChatGPTMessage[]): Promise<string> {
    try {
      console.log(`🔄 [CHATGPT_SERVICE] Chamando API OpenAI com modelo ${this.config.model}`);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ [CHATGPT_SERVICE] Erro na API: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Erro na API do ChatGPT: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();
      console.log(`✅ [CHATGPT_SERVICE] Resposta recebida com sucesso`);
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ [CHATGPT_SERVICE] Erro ao chamar API do ChatGPT:', error);
      throw error;
    }
  }

  // Gerar resumo de conversas
  async generateConversationSummary(request: ConversationSummaryRequest): Promise<ConversationSummaryResponse> {
    const conversationText = request.messages
      .map(msg => `[${msg.timestamp}] ${msg.isAgent ? 'Atendente' : msg.sender}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `Você é um assistente especializado em análise de conversas de atendimento ao cliente. 
    Analise a conversa fornecida e gere um resumo estruturado em português brasileiro.
    
    Forneça sua resposta no seguinte formato JSON:
    {
      "summary": "Resumo conciso da conversa em 2-3 frases",
      "keyPoints": ["Ponto principal 1", "Ponto principal 2", "Ponto principal 3"],
      "sentiment": "positive|neutral|negative",
      "actionItems": ["Ação necessária 1", "Ação necessária 2"],
      "customerSatisfaction": número de 1 a 10
    }`;

    const userPrompt = `Analise esta conversa do canal ${request.channelName} com o cliente ${request.contactName} 
    no período de ${request.dateRange.start} a ${request.dateRange.end}:

    ${conversationText}`;

    const messages: ChatGPTMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.callChatGPT(messages);
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ [CHATGPT_SERVICE] Erro ao gerar resumo da conversa:', error);
      // Retornar um resumo padrão em caso de erro
      return {
        summary: 'Não foi possível gerar o resumo automaticamente.',
        keyPoints: ['Conversa registrada no sistema'],
        sentiment: 'neutral',
        actionItems: ['Revisar conversa manualmente'],
        customerSatisfaction: 5
      };
    }
  }

  // Gerar insights para relatórios
  async generateReportInsights(reportData: any[], reportType: string): Promise<string> {
    const dataText = JSON.stringify(reportData.slice(0, 20), null, 2); // Limitar dados para não exceder tokens

    const systemPrompt = `Você é um analista de dados especializado em atendimento ao cliente. 
    Analise os dados fornecidos e gere insights valiosos em português brasileiro.
    Foque em tendências, padrões e recomendações práticas.`;

    const userPrompt = `Analise estes dados de ${reportType} e forneça insights importantes:

    ${dataText}

    Forneça insights sobre:
    1. Principais tendências identificadas
    2. Pontos de atenção
    3. Recomendações para melhoria
    4. Métricas importantes observadas`;

    const messages: ChatGPTMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.callChatGPT(messages);
    } catch (error) {
      console.error('❌ [CHATGPT_SERVICE] Erro ao gerar insights do relatório:', error);
      return 'Não foi possível gerar insights automaticamente para este relatório.';
    }
  }

  // Gerar recomendações baseadas em dados de performance
  async generatePerformanceRecommendations(performanceData: any): Promise<string[]> {
    const systemPrompt = `Você é um consultor de atendimento ao cliente. 
    Baseado nos dados de performance fornecidos, gere recomendações práticas e específicas 
    para melhorar o atendimento. Responda com uma lista de recomendações em português brasileiro.`;

    const userPrompt = `Baseado nestes dados de performance, forneça recomendações específicas:

    ${JSON.stringify(performanceData, null, 2)}

    Forneça 3-5 recomendações práticas para melhorar o atendimento.`;

    const messages: ChatGPTMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.callChatGPT(messages);
      // Tentar extrair lista de recomendações
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      return lines.map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());
    } catch (error) {
      console.error('❌ [CHATGPT_SERVICE] Erro ao gerar recomendações:', error);
      return ['Não foi possível gerar recomendações automaticamente.'];
    }
  }

  // Analisar sentimento de mensagens
  async analyzeSentiment(messages: string[]): Promise<{ sentiment: string; confidence: number }> {
    const messagesText = messages.join('\n');

    const systemPrompt = `Analise o sentimento geral das mensagens fornecidas. 
    Responda apenas com um JSON no formato: {"sentiment": "positive|neutral|negative", "confidence": 0.0-1.0}`;

    const userPrompt = `Analise o sentimento destas mensagens:

    ${messagesText}`;

    const chatMessages: ChatGPTMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.callChatGPT(chatMessages);
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ [CHATGPT_SERVICE] Erro ao analisar sentimento:', error);
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  // Validar se a API key está configurada corretamente
  async validateApiKey(): Promise<boolean> {
    try {
      console.log(`🔍 [CHATGPT_SERVICE] Validando API key...`);
      const testMessages: ChatGPTMessage[] = [
        { role: 'user', content: 'Teste de conexão. Responda apenas "OK".' }
      ];
      
      const response = await this.callChatGPT(testMessages);
      const isValid = response.toLowerCase().includes('ok');
      console.log(`${isValid ? '✅' : '❌'} [CHATGPT_SERVICE] Validação da API key: ${isValid ? 'Sucesso' : 'Falha'}`);
      return isValid;
    } catch (error) {
      console.error('❌ [CHATGPT_SERVICE] Erro ao validar API key:', error);
      return false;
    }
  }
}

// Função utilitária para criar uma instância do serviço
export function createChatGPTService(apiKey?: string): ChatGPTService | null {
  // Obter a API key apenas de fontes que funcionam no browser
  const key = apiKey || 
              localStorage.getItem('openai_api_key') ||
              sessionStorage.getItem('openai_api_key');

  if (!key) {
    console.warn('⚠️ [CHATGPT_SERVICE] API key do OpenAI não encontrada. Funcionalidades de IA não estarão disponíveis.');
    return null;
  }

  console.log(`🔑 [CHATGPT_SERVICE] Criando serviço com API key ${key.substring(0, 5)}...`);
  return new ChatGPTService({ apiKey: key });
}

// Hook para usar o ChatGPT Service em componentes React
export function useChatGPTService() {
  const [service, setService] = React.useState<ChatGPTService | null>(null);
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initService = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const chatGPTService = createChatGPTService();
        
        if (chatGPTService) {
          // Validar a API key
          const isValid = await chatGPTService.validateApiKey();
          
          if (isValid) {
            setService(chatGPTService);
            setIsConfigured(true);
            console.log(`✅ [CHATGPT_SERVICE] Serviço inicializado com sucesso`);
          } else {
            setError('API key inválida ou expirada');
            setIsConfigured(false);
            console.error(`❌ [CHATGPT_SERVICE] API key inválida ou expirada`);
          }
        } else {
          setError('API key não encontrada');
          setIsConfigured(false);
          console.error(`❌ [CHATGPT_SERVICE] API key não encontrada`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setIsConfigured(false);
        console.error(`❌ [CHATGPT_SERVICE] Erro ao inicializar serviço:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    initService();
  }, []);

  const configureApiKey = async (apiKey: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      localStorage.setItem('openai_api_key', apiKey);
      const newService = createChatGPTService(apiKey);
      
      if (newService) {
        // Validar a nova API key
        const isValid = await newService.validateApiKey();
        
        if (isValid) {
          setService(newService);
          setIsConfigured(true);
          console.log(`✅ [CHATGPT_SERVICE] API key configurada com sucesso`);
          return true;
        } else {
          setError('API key inválida ou expirada');
          setIsConfigured(false);
          console.error(`❌ [CHATGPT_SERVICE] API key inválida ou expirada`);
          return false;
        }
      } else {
        setError('Falha ao criar serviço com a API key fornecida');
        setIsConfigured(false);
        console.error(`❌ [CHATGPT_SERVICE] Falha ao criar serviço com a API key fornecida`);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsConfigured(false);
      console.error(`❌ [CHATGPT_SERVICE] Erro ao configurar API key:`, err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    service,
    isConfigured,
    isLoading,
    error,
    configureApiKey
  };
}
