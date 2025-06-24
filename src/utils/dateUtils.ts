
import { format, isToday, isYesterday, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatWhatsAppDate = (timestamp: string | null): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const hoursAgo = differenceInHours(now, date);
    
    // Se for hoje, mostrar só a hora
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    }
    
    // Se for ontem (menos de 48 horas)
    if (isYesterday(date) || hoursAgo < 48) {
      return 'ontem';
    }
    
    // Se for mais de 48 horas, mostrar data completa
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
};

export const formatTimeOnly = (timestamp: string | null): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return format(date, 'HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
};
