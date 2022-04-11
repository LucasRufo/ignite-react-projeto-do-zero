import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function formatDate(date: Date, formatString: string): string {
  const formatted = format(date, formatString, { locale: ptBR })

  return formatted
}