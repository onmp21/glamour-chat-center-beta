
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Phone, Video, Menu, CheckCheck } from 'lucide-react';

interface ChatHeaderProps {
  contactName: string;
  contactNumber: string;
  onClose: () => void;
  onSidebarToggle: () => void;
  onMarkAsResolved: () => void;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  contactName,
  contactNumber,
  onClose,
  onSidebarToggle,
  onMarkAsResolved,
  isDarkMode,
  isSidebarOpen
}) => {
  // Função para truncar nomes longos e limitar a 4 nomes
  const formatContactName = (name: string): string => {
    if (!name) return 'Cliente';
    
    // Se contém " e ", é múltiplos nomes
    if (name.includes(' e ')) {
      const parts = name.split(' e ');
      const beforeE = parts[0].split(', ');
      const afterE = parts[1];
      
      // Limitar total a 4 nomes
      const allNames = [...beforeE, afterE];
      if (allNames.length > 4) {
        const limitedNames = allNames.slice(0, 3);
        return `${limitedNames.join(', ')} e mais ${allNames.length - 3}`;
      }
    }
    
    // Truncar nome muito longo
    if (name.length > 50) {
      return name.substring(0, 47) + '...';
    }
    
    return name;
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border-b",
      isDarkMode ? "bg-[#2a2a2e] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className={cn(
              "md:hidden",
              isDarkMode ? "hover:bg-[#3a3a3e]" : "hover:bg-gray-100"
            )}
          >
            <Menu size={20} />
          </Button>
        )}
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
            "bg-gradient-to-r from-blue-500 to-purple-600"
          )}>
            {formatContactName(contactName).charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-sm truncate",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {formatContactName(contactName)}
            </h3>
            <p className={cn(
              "text-xs truncate",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              📱 {contactNumber}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMarkAsResolved}
          className={cn(
            "text-green-600 hover:text-green-700",
            isDarkMode ? "hover:bg-[#3a3a3e]" : "hover:bg-gray-100"
          )}
          title="Marcar como resolvida"
        >
          <CheckCheck size={18} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            isDarkMode ? "hover:bg-[#3a3a3e]" : "hover:bg-gray-100"
          )}
          title="Ligar"
        >
          <Phone size={18} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            isDarkMode ? "hover:bg-[#3a3a3e]" : "hover:bg-gray-100"
          )}
          title="Videochamada"
        >
          <Video size={18} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className={cn(
            "text-red-600 hover:text-red-700",
            isDarkMode ? "hover:bg-[#3a3a3e]" : "hover:bg-gray-100"
          )}
        >
          <X size={20} />
        </Button>
      </div>
    </div>
  );
};
