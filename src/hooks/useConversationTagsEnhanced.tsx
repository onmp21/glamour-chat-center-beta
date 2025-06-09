
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  conversation_id: string;
  channel_id: string;
  created_at: string;
}

export const useConversationTagsEnhanced = (channelId: string, conversationId: string) => {
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const predefinedTags = [
    { name: 'Urgente', color: '#ef4444' },
    { name: 'Importante', color: '#f59e0b' },
    { name: 'Aguardando', color: '#3b82f6' },
    { name: 'Resolvido', color: '#10b981' },
    { name: 'Follow-up', color: '#8b5cf6' },
    { name: 'Cliente VIP', color: '#ec4899' }
  ];

  const getStorageKey = () => `conversation_tags_${channelId}_${conversationId}`;

  const loadTags = async () => {
    if (!channelId || !conversationId) return;
    
    try {
      setLoading(true);
      
      // Load from localStorage only
      const storageKey = getStorageKey();
      const storedTags = localStorage.getItem(storageKey);
      
      if (storedTags) {
        const parsedTags = JSON.parse(storedTags);
        setTags(parsedTags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tags",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = async (name: string, color: string) => {
    try {
      const newTag: ConversationTag = {
        id: Date.now().toString(),
        conversation_id: conversationId,
        channel_id: channelId,
        name,
        color,
        created_at: new Date().toISOString()
      };

      const updatedTags = [...tags, newTag];
      setTags(updatedTags);

      // Save to localStorage
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedTags));
      
      toast({
        title: "Sucesso",
        description: "Tag adicionada com sucesso"
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tag",
        variant: "destructive"
      });
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      setTags(updatedTags);

      // Save to localStorage
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedTags));
      
      toast({
        title: "Sucesso",
        description: "Tag removida com sucesso"
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover tag",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTags();
  }, [channelId, conversationId]);

  return {
    tags,
    loading,
    predefinedTags,
    addTag,
    removeTag,
    refreshTags: loadTags
  };
};
