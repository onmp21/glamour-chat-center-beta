// Serviço mock para conversas - substituir pela implementação real
export class ConversationService {
  static async getChannels() {
    // Mock data - substituir pela chamada real da API
    return [
      { id: '1', name: 'WhatsApp', type: 'whatsapp' },
      { id: '2', name: 'Instagram', type: 'instagram' },
      { id: '3', name: 'Facebook', type: 'facebook' }
    ];
  }

  static async getConversationsForLLMAnalysis(limit: number, filters: any) {
    // Mock data - substituir pela chamada real da API
    return {
      conversations: [
        {
          id: '1',
          contact_name: 'João Silva',
          contact_phone: '+5511999999999',
          messages: [
            { content: 'Olá, preciso de ajuda', timestamp: '2024-12-15T10:00:00Z', sender: 'customer' },
            { content: 'Olá! Como posso ajudá-lo?', timestamp: '2024-12-15T10:01:00Z', sender: 'agent' }
          ]
        }
      ],
      total: 1
    };
  }

  static async getConversationsSummary(filters: any) {
    // Mock data - substituir pela chamada real da API
    return {
      total_conversations: 150,
      total_messages: 1200,
      avg_response_time: 5.2,
      satisfaction_rate: 0.85
    };
  }
}

export interface ConversationData {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message?: string;
  last_activity?: string;
  unread_count?: number;
}
