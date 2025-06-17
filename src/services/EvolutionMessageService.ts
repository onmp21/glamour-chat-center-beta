
import { supabase } from '@/integrations/supabase/client';

export class EvolutionMessageService {
  
  async getChannelMessages(channelId: string, conversationId?: string) {
    try {
      console.log('📨 [EVOLUTION_MESSAGE] Getting messages for channel:', channelId, 'conversation:', conversationId);
      
      // Por enquanto retornando array vazio já que não temos implementação específica
      return { success: true, messages: [], error: undefined };
    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Error getting messages:', error);
      return { success: false, messages: [], error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}
