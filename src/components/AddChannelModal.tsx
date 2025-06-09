
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (name: string) => void;
  isDarkMode: boolean;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  isDarkMode
}) => {
  const [channelName, setChannelName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      onAddChannel(channelName.trim());
      setChannelName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[425px] appear-animate",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Adicionar Novo Canal
          </DialogTitle>
          <DialogDescription className={cn(
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Digite o nome do novo canal de atendimento
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className={cn(
                "text-right",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Nome
              </Label>
              <Input
                id="name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className={cn(
                  "col-span-3 interactive-animate",
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-200"
                )}
                placeholder="Ex: Nova Loja"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={cn(
                isDarkMode 
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                  : "border-gray-300"
              )}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-villa-primary hover:bg-villa-primary/90">
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
