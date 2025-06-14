import { supabase } from '@/integrations/supabase/client';

interface ConversationMessage {
  id: number;
  message: string;
  nome_do_contato: string | null;
  session_id: string;
  tipo_remetente: string | null;
  read_at: string | null;
  mensagemtype: string | null;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  private apiKey: string | null;
  private baseUrl: string;

  constructor() {
    // Obter API key de fontes compatíveis com o navegador
    this.apiKey = this.getApiKey();
    this.baseUrl = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ [OPENAI_SERVICE] API key não encontrada. Configure através do localStorage ou sessionStorage.');
    }
  }

  /**
   * Obter API key de fontes compatíveis com o navegador
   */
  private getApiKey(): string | null {
    // Tentar obter de localStorage primeiro
    let apiKey = localStorage.getItem('openai_api_key');
    
    // Se não encontrar, tentar sessionStorage
    if (!apiKey) {
      apiKey = sessionStorage.getItem('openai_api_key');
    }
    
    // Se não encontrar, tentar de uma variável global (se definida)
    if (!apiKey && typeof window !== 'undefined' && (window as any).OPENAI_API_KEY) {
      apiKey = (window as any).OPENAI_API_KEY;
    }
    
    return apiKey;
  }

  /**
   * Mapear canais para tabelas do banco de dados
   */
  private getTableNameForChannel(channelId: string): string {
    const channelTableMapping: Record<string, string> = {
      'chat': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas',
      // Mapeamento por UUID também
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
      'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
      '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
      '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
      'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    };
    
    return channelTableMapping[channelId] || 'yelena_ai_conversas';
  }

  /**
   * Buscar mensagens de uma conversa específica
   */
  private async getConversationMessages(channelId: string, sessionId: string): Promise<ConversationMessage[]> {
    const tableName = this.getTableNameForChannel(channelId);
    
    console.log(`📋 [OPENAI_SERVICE] Buscando mensagens da tabela: ${tableName} para sessão: ${sessionId}`);

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ [OPENAI_SERVICE] Erro ao buscar mensagens:', error);
      throw new Error(`Erro ao buscar mensagens: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Formatar mensagens para o prompt da OpenAI
   */
  private formatMessagesForPrompt(messages: ConversationMessage[]): string {
    if (!messages.length) {
      return 'Nenhuma mensagem encontrada na conversa.';
    }

    const contactName = messages[0]?.nome_do_contato || 'Cliente';
    let formattedMessages = `Conversa com ${contactName}:\n\n`;

    messages.forEach((msg, index) => {
      const sender = msg.tipo_remetente === 'customer' ? contactName : 'Atendente';
      const timestamp = msg.read_at ? new Date(msg.read_at).toLocaleString('pt-BR') : 'Data não disponível';
      
      formattedMessages += `${index + 1}. [${timestamp}] ${sender}: ${msg.message}\n`;
    });

    return formattedMessages;
  }

  /**
   * Gerar resumo da conversa usando OpenAI
   */
  async generateConversationSummary(channelId: string, sessionId: string): Promise<string> {
    try {
      console.log(`🤖 [OPENAI_SERVICE] Gerando resumo para canal: ${channelId}, sessão: ${sessionId}`);

      // Buscar mensagens da conversa
      const messages = await this.getConversationMessages(channelId, sessionId);
      
      if (!messages.length) {
        return 'Não há mensagens suficientes para gerar um resumo.';
      }

      // Formatar mensagens para o prompt
      const conversationText = this.formatMessagesForPrompt(messages);
      
      // Criar prompt para a OpenAI
      const prompt = `Analise a seguinte conversa de atendimento ao cliente e gere um resumo estruturado:

${conversationText}

Por favor, forneça um resumo que inclua:

1. **Resumo Geral**: Breve descrição do que foi discutido
2. **Pontos Principais**: Lista dos tópicos mais importantes abordados
3. **Status da Conversa**: Se foi resolvida, está pendente, ou precisa de acompanhamento
4. **Próximos Passos**: Ações recomendadas (se aplicável)
5. **Sentimento do Cliente**: Satisfeito, neutro, ou insatisfeito

Mantenha o resumo conciso mas informativo, em português brasileiro.`;

      // Verificar se a API key está disponível
      if (!this.apiKey) {
        throw new Error('API key da OpenAI não configurada. Configure através do localStorage: localStorage.setItem("openai_api_key", "sua-chave-aqui")');
      }

      // Fazer chamada para a API da OpenAI
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em análise de conversas de atendimento ao cliente. Gere resumos claros, objetivos e úteis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [OPENAI_SERVICE] Erro na API da OpenAI:', errorData);
        throw new Error(`Erro na API da OpenAI: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const data: OpenAIResponse = await response.json();
      const summary = data.choices[0]?.message?.content || 'Não foi possível gerar o resumo.';

      console.log('✅ [OPENAI_SERVICE] Resumo gerado com sucesso');
      return summary;

    } catch (error) {
      console.error('❌ [OPENAI_SERVICE] Erro ao gerar resumo:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erro desconhecido ao gerar resumo da conversa');
    }
  }

  /**
   * Gerar resposta sugerida baseada no contexto da conversa
   */
  async generateSuggestedResponse(channelId: string, sessionId: string, lastMessages: number = 5): Promise<string> {
    try {
      console.log(`🤖 [OPENAI_SERVICE] Gerando resposta sugerida para canal: ${channelId}, sessão: ${sessionId}`);

      // Buscar últimas mensagens da conversa
      const allMessages = await this.getConversationMessages(channelId, sessionId);
      const recentMessages = allMessages.slice(-lastMessages);
      
      if (!recentMessages.length) {
        return 'Olá! Como posso ajudá-lo hoje?';
      }

      // Formatar mensagens para o prompt
      const conversationText = this.formatMessagesForPrompt(recentMessages);
      
      // Criar prompt para gerar resposta sugerida
      const prompt = `Com base no contexto da conversa abaixo, sugira uma resposta apropriada para o atendente:

${conversationText}

Gere uma resposta que seja:
- Profissional e cordial
- Relevante ao contexto da conversa
- Útil para o cliente
- Em português brasileiro
- Concisa (máximo 2-3 frases)

Resposta sugerida:`;

      // Verificar se a API key está disponível
      if (!this.apiKey) {
        throw new Error('API key da OpenAI não configurada. Configure através do localStorage: localStorage.setItem("openai_api_key", "sua-chave-aqui")');
      }

      // Fazer chamada para a API da OpenAI
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente de atendimento ao cliente especializado em gerar respostas profissionais e úteis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [OPENAI_SERVICE] Erro na API da OpenAI:', errorData);
        throw new Error(`Erro na API da OpenAI: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const data: OpenAIResponse = await response.json();
      const suggestedResponse = data.choices[0]?.message?.content || 'Obrigado pelo contato. Como posso ajudá-lo?';

      console.log('✅ [OPENAI_SERVICE] Resposta sugerida gerada com sucesso');
      return suggestedResponse.trim();

    } catch (error) {
      console.error('❌ [OPENAI_SERVICE] Erro ao gerar resposta sugerida:', error);
      
      // Retornar resposta padrão em caso de erro
      return 'Obrigado pelo contato. Como posso ajudá-lo hoje?';
    }
  }
}

// Instância singleton do serviço
export const openaiService = new OpenAIService();

