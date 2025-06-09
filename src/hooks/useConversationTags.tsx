
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ConversationTag {
  id: string;
  conversation_id: string;
  tag_id: string;
  created_at: string;
  tag?: {
    id: string;
    name: string;
    color: string;
  };
}

export const useConversationTags = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock tags since we removed the tags system
  const mockTags = [
    { id: '1', name: 'Urgente', color: '#dc2626' },
    { id: '2', name: 'Exames', color: '#b5103c' }
  ];

  const addTagToConversation = async (conversationId: string, tagId: string) => {
    try {
      setLoading(true);
      
      // Simulate using localStorage
      const storageKey = `conversation_${conversationId}_tags`;
      const existingTags = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (!existingTags.includes(tagId)) {
        existingTags.push(tagId);
        localStorage.setItem(storageKey, JSON.stringify(existingTags));
      }

      toast({
        title: "Sucesso",
        description: "Tag adicionada à conversa",
      });

      return true;
    } catch (error) {
      console.error('Error adding tag to conversation:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tag",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeTagFromConversation = async (conversationId: string, tagId: string) => {
    try {
      setLoading(true);
      
      // Simulate using localStorage
      const storageKey = `conversation_${conversationId}_tags`;
      const existingTags = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedTags = existingTags.filter((id: string) => id !== tagId);
      localStorage.setItem(storageKey, JSON.stringify(updatedTags));

      toast({
        title: "Sucesso",
        description: "Tag removida da conversa",
      });

      return true;
    } catch (error) {
      console.error('Error removing tag from conversation:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover tag",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getConversationTags = async (conversationId: string): Promise<ConversationTag[]> => {
    try {
      // Simulate using localStorage with existing tags
      const storageKey = `conversation_${conversationId}_tags`;
      const conversationTagIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const mockConversationTags: ConversationTag[] = mockTags.slice(0, 2).map(tag => ({
        id: `ct_${conversationId}_${tag.id}`,
        conversation_id: conversationId,
        tag_id: tag.id,
        created_at: new Date().toISOString(),
        tag
      }));

      return mockConversationTags;
    } catch (error) {
      console.error('Error fetching conversation tags:', error);
      return [];
    }
  };

  return {
    loading,
    addTagToConversation,
    removeTagFromConversation,
    getConversationTags
  };
};
