
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { useConversationNotes } from '@/hooks/useConversationNotes';
import { format } from 'date-fns';

interface ConversationNotesModalProps {
  isDarkMode: boolean;
  channelId: string;
  conversationId: string;
}

export const ConversationNotesModal: React.FC<ConversationNotesModalProps> = ({
  isDarkMode,
  channelId,
  conversationId
}) => {
  const [open, setOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { notes, loading, addNote, deleteNote } = useConversationNotes(channelId, conversationId);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await addNote(newNote.trim());
    setNewNote('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "justify-start",
            isDarkMode ? "text-zinc-300 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <StickyNote size={16} className="mr-2" />
          Notas
          {notes.length > 0 && (
            <span className={cn(
              "ml-auto text-xs px-1.5 py-0.5 rounded-full",
              isDarkMode ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600"
            )}>
              {notes.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-2xl max-h-[80vh]",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "text-zinc-100" : "text-gray-900"}>
            Notas da Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new note */}
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Adicionar nova nota..."
              className={cn(
                "resize-none",
                isDarkMode 
                  ? "bg-zinc-800 border-zinc-700 text-zinc-100" 
                  : "bg-white border-gray-300"
              )}
              rows={3}
            />
            <Button 
              onClick={handleAddNote}
              disabled={!newNote.trim() || loading}
              size="sm"
            >
              <Plus size={16} className="mr-1" />
              Adicionar Nota
            </Button>
          </div>

          {/* Notes list */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className={cn(
                  "text-center py-8 text-sm",
                  isDarkMode ? "text-zinc-500" : "text-gray-500"
                )}>
                  Nenhuma nota encontrada
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      isDarkMode 
                        ? "bg-zinc-800 border-zinc-700" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-xs",
                        isDarkMode ? "text-zinc-400" : "text-gray-500"
                      )}>
                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')} - {note.created_by}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    <p className={cn(
                      "text-sm whitespace-pre-wrap",
                      isDarkMode ? "text-zinc-200" : "text-gray-800"
                    )}>
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
