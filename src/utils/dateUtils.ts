
import { format, isToday, isYesterday, differenceInHours, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatWhatsAppDate = (timestamp: string | null): string => {
  if (!timestamp) return '';
  
  try {
    // Se o timestamp já contém informação de timezone ou é uma string de data válida
    let date: Date;
    
    if (timestamp.includes('T') || timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-')) {
      // É um timestamp ISO com timezone - usar parseISO
      date = parseISO(timestamp);
    } else {
      // É uma string de data simples - assumir que já está no fuso horário correto (brasileiro)
      date = new Date(timestamp);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const hoursAgo = differenceInHours(now, date);
    
    // Se for hoje, mostrar só a hora
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    }
    
    // Se for ontem ou menos de 48 horas atrás
    if (isYesterday(date) || hoursAgo < 48) {
      return 'ontem';
    }
    
    // Se for mais de 48 horas, mostrar data completa
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Timestamp:', timestamp);
    return '';
  }
};

export const formatTimeOnly = (timestamp: string | null): string => {
  if (!timestamp) return '';
  
  try {
    let date: Date;
    
    if (timestamp.includes('T') || timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-')) {
      date = parseISO(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return format(date, 'HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return '';
  }
};
