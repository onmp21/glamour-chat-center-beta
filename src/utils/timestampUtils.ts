
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getBrazilianTimestamp = (): string => {
  const now = new Date();
  // Aplicar offset do horário brasileiro (UTC-3)
  const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return brazilTime.toISOString();
};

export const parseTimestamp = (timestamp: string): Date => {
  if (!timestamp) return new Date();
  
  // Se já é um timestamp válido, usar parseISO
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    const parsed = parseISO(timestamp);
    return isValid(parsed) ? parsed : new Date();
  }
  
  // Tentar converter strings antigas
  const date = new Date(timestamp);
  return isValid(date) ? date : new Date();
};

export const formatTimestamp = (timestamp: string, formatStr: string = 'HH:mm'): string => {
  const date = parseTimestamp(timestamp);
  return format(date, formatStr, { locale: ptBR });
};

export const formatDate = (timestamp: string): string => {
  const date = parseTimestamp(timestamp);
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateTime = (timestamp: string): string => {
  const date = parseTimestamp(timestamp);
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};
