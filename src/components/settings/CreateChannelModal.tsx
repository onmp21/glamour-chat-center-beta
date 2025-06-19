
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useChannelManagement } from '@/hooks/useChannelManagement';
import { CreateChannelData } from '@/services/ChannelManagementService';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';

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
    type: 'general',
    isDefault: false
  });
  const [nameError, setNameError] = useState('');
  
  const { loading, createChannel, validateChannelName } = useChannelManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setNameError('Nome é obrigatório');
      return;
    }

    // Validar nome
    const isValid = await validateChannelName(formData.name);
    if (!isValid) {
      setNameError('Já existe um canal com este nome');
      return;
    }

    const result = await createChannel(formData);
    
    if (result.success) {
      // Reset form
      setFormData({
        name: '',
        type: 'general',
        isDefault: false
      });
      setNameError('');
      onClose();
    } else {
      setNameError(result.error || 'Erro ao criar canal');
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    setNameError('');
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        type: 'general',
        isDefault: false
      });
      setNameError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2 text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            <Plus className="h-5 w-5 text-[#b5103c]" />
            Criar Novo Canal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Nome do Canal *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Canal WhatsApp Loja Centro"
              className={cn(
                "w-full",
                isDarkMode ? "bg-[#2a2a2a] border-[#444] text-white" : "bg-white border-gray-300",
                nameError && "border-red-500"
              )}
              disabled={loading}
            />
            {nameError && (
              <p className="text-red-500 text-sm">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Tipo de Canal *
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'general' | 'store' | 'manager' | 'admin') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
              disabled={loading}
            >
              <SelectTrigger className={cn(
                "w-full",
                isDarkMode ? "bg-[#2a2a2a] border-[#444] text-white" : "bg-white border-gray-300"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(
                isDarkMode ? "bg-[#2a2a2a] border-[#444]" : "bg-white border-gray-300"
              )}>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="store">Loja</SelectItem>
                <SelectItem value="manager">Gerência</SelectItem>
                <SelectItem value="admin">Administração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Canal Padrão
            </Label>
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isDefault: checked }))
              }
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className={cn(
                isDarkMode ? "border-[#444] text-gray-300 hover:bg-[#333]" : "border-gray-300"
              )}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Canal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
