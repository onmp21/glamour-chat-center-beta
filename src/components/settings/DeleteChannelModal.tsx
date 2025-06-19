
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useChannelManagement } from '@/hooks/useChannelManagement';
import { cn } from '@/lib/utils';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
}

interface DeleteChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  isDarkMode: boolean;
}

export const DeleteChannelModal: React.FC<DeleteChannelModalProps> = ({
  isOpen,
  onClose,
  channel,
  isDarkMode
}) => {
  const [createBackup, setCreateBackup] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { loading, deleteChannel } = useChannelManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channel || !confirmDelete) return;

    const result = await deleteChannel(channel.id, createBackup);
    
    if (result.success) {
      setConfirmDelete(false);
      setCreateBackup(true);
      onClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmDelete(false);
      setCreateBackup(true);
      onClose();
    }
  };

  if (!channel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2 text-lg font-semibold text-red-600",
            isDarkMode ? "text-red-400" : "text-red-600"
          )}>
            <Trash2 className="h-5 w-5" />
            Excluir Canal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-lg",
            isDarkMode ? "bg-red-950/20 border border-red-900/30" : "bg-red-50 border border-red-200"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5 mt-0.5 flex-shrink-0",
              isDarkMode ? "text-red-400" : "text-red-600"
            )} />
            <div className="space-y-2">
              <p className={cn(
                "font-medium",
                isDarkMode ? "text-red-300" : "text-red-700"
              )}>
                Atenção! Esta ação não pode ser desfeita.
              </p>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-red-400" : "text-red-600"
              )}>
                Você está prestes a excluir o canal "{channel.name}" e toda sua tabela de conversas associada.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="backup"
                checked={createBackup}
                onCheckedChange={setCreateBackup}
                disabled={loading}
              />
              <label 
                htmlFor="backup" 
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}
              >
                Criar backup antes de excluir (recomendado)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmDelete}
                onCheckedChange={setConfirmDelete}
                disabled={loading}
              />
              <label 
                htmlFor="confirm" 
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}
              >
                Confirmo que desejo excluir este canal permanentemente
              </label>
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
                disabled={loading || !confirmDelete}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Canal
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
