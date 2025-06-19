
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannelManagementService, CreateChannelData } from '@/services/ChannelManagementService';
import { useChannels } from '@/contexts/ChannelContext';
import { cn } from '@/lib/utils';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [formData, setFormData] = useState<CreateChannelData>({
    name: '',
    type: 'general'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { refetch } = useChannels();
  const channelService = ChannelManagementService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome do canal é obrigatório');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await channelService.createChannel(formData);
      
      if (result.success) {
        // Refetch para atualizar a lista
        await refetch();
        
        // Fechar modal e limpar formulário
        onClose();
        setFormData({ name: '', type: 'general' });
      } else {
        setError(result.error || 'Erro ao criar canal');
      }
    } catch (err) {
      setError('Erro inesperado ao criar canal');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      onClose();
      setFormData({ name: '', type: 'general' });
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Criar Novo Canal
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="channelName">Nome do Canal</Label>
            <Input
              id="channelName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome do canal"
              disabled={creating}
              className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
              )}
            />
          </div>

          <div>
            <Label htmlFor="channelType">Tipo do Canal</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'general' | 'store' | 'manager' | 'admin') => 
                setFormData({ ...formData, type: value })
              }
              disabled={creating}
            >
              <SelectTrigger className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
              )}>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="store">Loja</SelectItem>
                <SelectItem value="manager">Gerência</SelectItem>
                <SelectItem value="admin">Administração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.name.trim()}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {creating ? 'Criando...' : 'Criar Canal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
