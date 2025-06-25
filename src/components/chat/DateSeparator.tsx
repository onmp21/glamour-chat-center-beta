
import React from 'react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSeparatorProps {
  date: string;
  isDarkMode: boolean;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date, isDarkMode }) => {
  const formatWhatsAppDate = (dateString: string): string => {
    try {
      const messageDate = parseISO(dateString);
      
      if (isToday(messageDate)) {
        return 'Hoje';
      } else if (isYesterday(messageDate)) {
        return 'Ontem';
      } else {
        return format(messageDate, 'dd/MM/yyyy', { locale: ptBR });
      }
    } catch (error) {
      console.error('Error formatting WhatsApp date:', error);
      return 'Data inválida';
    }
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className={cn(
        "px-3 py-1 rounded-full text-xs font-medium shadow-sm",
        isDarkMode 
          ? "bg-zinc-800 text-zinc-300 border border-zinc-700" 
          : "bg-gray-100 text-gray-600 border border-gray-200"
      )}>
        {formatWhatsAppDate(date)}
      </div>
    </div>
  );
};
