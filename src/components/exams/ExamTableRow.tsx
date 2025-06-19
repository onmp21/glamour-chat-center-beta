
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Exam {
  id: string;
  patient_name: string;
  exam_type: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ExamTableRowProps {
  exam: Exam;
  isDarkMode: boolean;
  onClick: () => void;
}

export const ExamTableRow: React.FC<ExamTableRowProps> = ({
  exam,
  isDarkMode,
  onClick
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'scheduled':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'cancelled':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-muted-foreground' : 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return isDarkMode ? 'bg-green-500/20' : 'bg-green-100';
      case 'scheduled':
        return isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100';
      case 'cancelled':
        return isDarkMode ? 'bg-red-500/20' : 'bg-red-100';
      default:
        return isDarkMode ? 'bg-muted' : 'bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'scheduled':
        return 'Agendado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <tr className={cn(
      "hover:bg-muted/50 cursor-pointer transition-colors",
      isDarkMode ? "hover:bg-muted/30" : "hover:bg-gray-50"
    )} onClick={onClick}>
      <td className={cn(
        "px-6 py-4 whitespace-nowrap text-sm font-medium",
        isDarkMode ? "text-card-foreground" : "text-gray-900"
      )}>
        {exam.patient_name}
      </td>
      <td className={cn(
        "px-6 py-4 whitespace-nowrap text-sm",
        isDarkMode ? "text-muted-foreground" : "text-gray-500"
      )}>
        {exam.exam_type}
      </td>
      <td className={cn(
        "px-6 py-4 whitespace-nowrap text-sm",
        isDarkMode ? "text-muted-foreground" : "text-gray-500"
      )}>
        {new Date(exam.appointment_date).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn(
          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
          getStatusColor(exam.status),
          getStatusBg(exam.status)
        )}>
          {getStatusText(exam.status)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-1"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implementar edição
            }}
            className="p-1"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implementar exclusão
            }}
            className="p-1 text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </td>
    </tr>
  );
};
