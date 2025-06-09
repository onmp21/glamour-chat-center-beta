
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tags, Plus, X } from 'lucide-react';
import { useConversationTagsEnhanced } from '@/hooks/useConversationTagsEnhanced';

interface ConversationTagsModalProps {
  isDarkMode: boolean;
  channelId: string;
  conversationId: string;
}

export const ConversationTagsModal: React.FC<ConversationTagsModalProps> = ({
  isDarkMode,
  channelId,
  conversationId
}) => {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const { tags, loading, predefinedTags, addTag, removeTag } = useConversationTagsEnhanced(channelId, conversationId);

  const handleAddTag = async (name: string, color: string) => {
    if (!name.trim()) return;
    
    await addTag(name.trim(), color);
    setNewTagName('');
  };

  const handleAddPredefinedTag = async (tag: { name: string; color: string }) => {
    const exists = tags.some(t => t.name === tag.name);
    if (exists) return;
    
    await addTag(tag.name, tag.color);
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
          <Tags size={16} className="mr-2" />
          Tags
          {tags.length > 0 && (
            <span className={cn(
              "ml-auto text-xs px-1.5 py-0.5 rounded-full",
              isDarkMode ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600"
            )}>
              {tags.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-2xl",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "text-zinc-100" : "text-gray-900"}>
            Tags da Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current tags */}
          <div>
            <h4 className={cn(
              "text-sm font-medium mb-2",
              isDarkMode ? "text-zinc-300" : "text-gray-700"
            )}>
              Tags Atuais
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-zinc-500" : "text-gray-500"
                )}>
                  Nenhuma tag adicionada
                </p>
              ) : (
                tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                    className="flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Predefined tags */}
          <div>
            <h4 className={cn(
              "text-sm font-medium mb-2",
              isDarkMode ? "text-zinc-300" : "text-gray-700"
            )}>
              Tags Predefinidas
            </h4>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map((tag) => {
                const exists = tags.some(t => t.name === tag.name);
                return (
                  <Button
                    key={tag.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPredefinedTag(tag)}
                    disabled={exists || loading}
                    style={{ 
                      borderColor: tag.color, 
                      color: exists ? '#6b7280' : tag.color 
                    }}
                    className={cn(
                      "text-xs",
                      exists && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Plus size={12} className="mr-1" />
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom tag */}
          <div>
            <h4 className={cn(
              "text-sm font-medium mb-2",
              isDarkMode ? "text-zinc-300" : "text-gray-700"
            )}>
              Criar Tag Personalizada
            </h4>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nome da tag..."
                className={cn(
                  "flex-1",
                  isDarkMode 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100" 
                    : "bg-white border-gray-300"
                )}
              />
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-10 h-10 rounded border"
              />
              <Button
                onClick={() => handleAddTag(newTagName, selectedColor)}
                disabled={!newTagName.trim() || loading}
                size="sm"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
