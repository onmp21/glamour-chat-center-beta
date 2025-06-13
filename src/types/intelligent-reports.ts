export interface IntelligentReportRequest {
  prompt: string;
  filters: {
    channels?: string[];
    date_range?: {
      start_date: string;
      end_date: string;
    };
    message_types?: string[];
    contact_names?: string[];
    session_ids?: string[];
  };
  ai_provider_id: string;
  report_type?: 'summary' | 'analysis' | 'trends' | 'custom';
}

export interface IntelligentReportResponse {
  id: string;
  content: string;
  metadata: {
    tokens_used: number;
    processing_time_ms: number;
    data_points_analyzed: number;
    ai_provider_used: string;
    model_used: string;
  };
  created_at: string;
  status: 'completed' | 'processing' | 'failed';
  error_message?: string;
}

export interface ReportFilter {
  id: string;
  label: string;
  type: 'select' | 'date_range' | 'multi_select' | 'text';
  options?: { value: string; label: string }[];
  value?: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  suggested_filters: string[];
  category: 'customer_service' | 'analytics' | 'performance' | 'custom';
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'customer_satisfaction',
    name: 'Análise de Satisfação do Cliente',
    description: 'Analisa o sentimento e satisfação dos clientes nas conversas',
    prompt_template: 'Analise as conversas dos últimos {period} e identifique padrões de satisfação do cliente, problemas recorrentes e oportunidades de melhoria.',
    suggested_filters: ['channels', 'date_range'],
    category: 'customer_service'
  },
  {
    id: 'response_time_analysis',
    name: 'Análise de Tempo de Resposta',
    description: 'Avalia os tempos de resposta e eficiência do atendimento',
    prompt_template: 'Analise os tempos de resposta nas conversas e identifique gargalos no atendimento, horários de pico e sugestões para otimização.',
    suggested_filters: ['channels', 'date_range'],
    category: 'performance'
  },
  {
    id: 'conversation_trends',
    name: 'Tendências de Conversas',
    description: 'Identifica tendências e padrões nas conversas ao longo do tempo',
    prompt_template: 'Identifique tendências, tópicos emergentes e mudanças nos padrões de conversas ao longo do período selecionado.',
    suggested_filters: ['channels', 'date_range', 'message_types'],
    category: 'analytics'
  },
  {
    id: 'custom_analysis',
    name: 'Análise Personalizada',
    description: 'Permite criar análises customizadas com prompt livre',
    prompt_template: '',
    suggested_filters: ['channels', 'date_range', 'message_types', 'contact_names'],
    category: 'custom'
  }
];

