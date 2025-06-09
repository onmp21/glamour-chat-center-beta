
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShoppingCart, Headphones, HelpCircle, Star } from 'lucide-react';

interface ConversationTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onTagSelect: (tag: string) => void;
}

export const ConversationTagModal: React.FC<ConversationTagModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onTagSelect
}) => {
  const tags = [
    { 
      id: 'urgent', 
      label: 'Urgente', 
      icon: AlertTriangle, 
      color: '#b5103c', // Único vermelho permitido
      bgColor: '#b5103c15' 
    },
    { 
      id: 'sale', 
      label: 'Venda', 
      icon: ShoppingCart, 
      color: isDarkMode ? '#71717a' : '#6b7280', // Cinza neutro
      bgColor: isDarkMode ? '#71717a15' : '#6b728015' 
    },
    { 
      id: 'support', 
      label: 'Suporte', 
      icon: Headphones, 
      color: isDarkMode ? '#71717a' : '#6b7280', 
      bgColor: isDarkMode ? '#71717a15' : '#6b728015' 
    },
    { 
      id: 'question', 
      label: 'Dúvida', 
      icon: HelpCircle, 
      color: isDarkMode ? '#71717a' : '#6b7280', 
      bgColor: isDarkMode ? '#71717a15' : '#6b728015' 
    },
    { 
      id: 'vip', 
      label: 'VIP', 
      icon: Star, 
      color: isDarkMode ? '#71717a' : '#6b7280', 
      bgColor: isDarkMode ? '#71717a15' : '#6b728015' 
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-900"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-zinc-100" : "text-gray-900"
          )}>
            Classificar Conversa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-zinc-400" : "text-gray-600"
          )}>
            Selecione uma categoria para classificar esta conversa:
          </p>
          
          <div className="space-y-3">
            {tags.map(tag => {
              const IconComponent = tag.icon;
              return (
                <Button
                  key={tag.id}
                  variant="outline"
                  onClick={() => onTagSelect(tag.id)}
                  className={cn(
                    "w-full justify-start gap-3 h-12 border transition-all duration-200 hover:scale-[1.01]",
                    isDarkMode 
                      ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-750 hover:border-zinc-600" 
                      : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  <div 
                    className="rounded-full p-2"
                    style={{ backgroundColor: tag.bgColor }}
                  >
                    <IconComponent size={16} style={{ color: tag.color }} />
                  </div>
                  <span className="font-medium">{tag.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
