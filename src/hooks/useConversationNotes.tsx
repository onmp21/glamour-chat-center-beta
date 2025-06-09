
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ConversationNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

export const useConversationNotes = (channelId: string, conversationId: string) => {
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadNotes = async () => {
    // For now, return empty array since conversation_notes table doesn't exist
    // This can be implemented later when the table is created
    setNotes([]);
    setLoading(false);
  };

  const addNote = async (content: string) => {
    if (!channelId || !conversationId || !content.trim()) return;
    
    try {
      // Simulate adding note locally for now
      const newNote: ConversationNote = {
        id: Date.now().toString(),
        content: content.trim(),
        created_at: new Date().toISOString(),
        created_by: user?.name || 'Usuário'
      };
      
      setNotes(prev => [newNote, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Nota adicionada com sucesso"
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar nota",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      toast({
        title: "Sucesso",
        description: "Nota removida com sucesso"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover nota",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadNotes();
  }, [channelId, conversationId]);

  return {
    notes,
    loading,
    addNote,
    deleteNote,
    refreshNotes: loadNotes
  };
};
