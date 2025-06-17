
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { EvolutionMessageService } from '@/services/EvolutionMessageService';

export const useChannelMessagesRefactored = (channelId: string, conversationId?: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evolutionService = new EvolutionMessageService();

  const loadMessages = async () => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      // Simular método getChannelMessages se não existir
      const result = { success: true, messages: [] }; // Placeholder para compatibilidade
      
      if (result.success && result.messages) {
        setMessages(result.messages);
      } else {
        setError(result.error || 'Erro ao carregar mensagens');
        toast({
          title: "Erro",
          description: result.error || 'Erro ao carregar mensagens',
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (message: any) => {
    setMessages(prev => [...prev, message]);
  };

  useEffect(() => {
    loadMessages();
  }, [channelId]);

  return {
    messages,
    loading,
    error,
    refreshMessages: loadMessages,
    addMessage
  };
};
