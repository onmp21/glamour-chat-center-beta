
import React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface ChannelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelSelect: (channel: string) => void;
  contactName: string;
  availableChannels: string[];
  isDarkMode: boolean;
}

export const ChannelSelectorModal: React.FC<ChannelSelectorModalProps> = ({
  isOpen,
  onClose,
  onChannelSelect,
  contactName,
  availableChannels,
  isDarkMode
}) => {
  const getChannelDisplayName = (channel: string) => {
    console.log('🏷️ [CHANNEL_SELECTOR] Mapping channel:', channel);
    
    switch (channel.toLowerCase()) {
      case 'chat':
      case 'yelena-ai':
        return 'Yelena-AI';
      case 'whatsapp':
      case 'canarana':
        return 'Canarana';
      case 'souto-soares':
        return 'Souto Soares';
      case 'joao-dourado':
        return 'João Dourado';
      case 'america-dourada':
        return 'América Dourada';
      case 'gerente-externo':
        return 'Andressa Gerente';
      case 'gerente-lojas':
        return 'Gustavo Gerente';
      default:
        return channel;
    }
  };

  const handleChannelClick = (channel: string) => {
    console.log('🚀 [CHANNEL_SELECTOR] Channel selected:', channel);
    onChannelSelect(channel);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
            Selecionar Canal
          </DialogTitle>
          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            {contactName} está disponível em múltiplos canais. Escolha qual conversa deseja abrir:
          </p>
        </DialogHeader>
        
        <div className="space-y-2">
          {availableChannels.map((channel) => (
            <Button
              key={channel}
              variant="outline"
              onClick={() => handleChannelClick(channel)}
              className={cn(
                "w-full justify-start gap-3",
                isDarkMode 
                  ? "border-[#3f3f46] hover:bg-[#27272a]" 
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <MessageSquare size={16} className="text-[#b5103c]" />
              {getChannelDisplayName(channel)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
