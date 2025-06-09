
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: {
    nome: string;
    telefone: string;
    canal: string;
  }) => void;
  isDarkMode: boolean;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    canal: ''
  });

  const availableChannels = [
    { id: 'canarana', name: 'Canarana WhatsApp' },
    { id: 'souto-soares', name: 'Souto Soares WhatsApp' },
    { id: 'joao-dourado', name: 'João Dourado WhatsApp' },
    { id: 'america-dourada', name: 'América Dourada WhatsApp' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome && formData.telefone && formData.canal) {
      onSubmit(formData);
      setFormData({ nome: '', telefone: '', canal: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Novo Contato
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome" className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              Nome do Contato *
            </Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome do contato"
              className={cn(
                "mt-1",
                isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
              )}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone" className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              Número de Telefone *
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="Ex: 5562992631631"
              className={cn(
                "mt-1",
                isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
              )}
              required
            />
            <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Inclua o código do país (55) + DDD + número
            </p>
          </div>

          <div>
            <Label className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              Canal para Envio *
            </Label>
            <Select value={formData.canal} onValueChange={(value) => setFormData({ ...formData, canal: value })}>
              <SelectTrigger className={cn(
                "mt-1",
                isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
              )}>
                <SelectValue placeholder="Selecione um canal" />
              </SelectTrigger>
              <SelectContent className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
              )}>
                {availableChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              Criar Contato
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
