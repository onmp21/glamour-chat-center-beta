
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Exam } from '@/hooks/useExams';

interface ExamTableRowProps {
  exam: Exam;
  isDarkMode: boolean;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onEdit: () => void;
}

export const ExamTableRow: React.FC<ExamTableRowProps> = ({
  exam,
  isDarkMode,
  isMultiSelectMode,
  isSelected,
  onToggleSelection,
  onEdit
}) => {
  return (
    <tr 
      className={cn(
        isSelected && "ring-2 ring-[#b5103c]",
        isDarkMode ? "bg-[#1a1a1a] hover:bg-[#2a2a2a]" : "bg-white hover:bg-gray-100"
      )}
    >
      {isMultiSelectMode && (
        <td className="px-6 py-4 whitespace-nowrap">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
          />
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm", isDarkMode ? "text-gray-200" : "text-gray-500")}>
          #{exam.id.slice(0, 8)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
          {exam.name}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm", isDarkMode ? "text-gray-200" : "text-gray-500")}>
          {exam.phone}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm", isDarkMode ? "text-gray-200" : "text-gray-500")}>
          {exam.instagram}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm", isDarkMode ? "text-gray-200" : "text-gray-500")}>
          {new Date(exam.appointmentDate).toLocaleDateString('pt-BR')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm", isDarkMode ? "text-gray-200" : "text-gray-500")}>
          {exam.city}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex items-center gap-1"
        >
          <Edit size={14} />
          Editar
        </Button>
      </td>
    </tr>
  );
};
