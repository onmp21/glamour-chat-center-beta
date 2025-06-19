
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Exam } from '@/hooks/useExams';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Calendar } from 'lucide-react';

interface ExamTableProps {
  exams: Exam[];
  isDarkMode: boolean;
  selectedExams: string[];
  onExamSelect: (examId: string) => void;
  onSelectAll: () => void;
  onEdit: (exam: Exam) => void;
  showWeekFilter: boolean;
}

export const ExamTable: React.FC<ExamTableProps> = ({
  exams,
  isDarkMode,
  selectedExams,
  onExamSelect,
  onSelectAll,
  onEdit,
  showWeekFilter
}) => {
  const isAllSelected = exams.length > 0 && selectedExams.length === exams.length;
  const isPartiallySelected = selectedExams.length > 0 && selectedExams.length < exams.length;

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden",
      isDarkMode ? "border-[#3f3f46]" : "border-slate-200"
    )}>
      <Table>
        <TableHeader>
          <TableRow className={cn(
            isDarkMode ? "bg-[#1a1a1a] border-[#3f3f46]" : "bg-slate-50 border-slate-200"
          )}>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className={cn(
                  "data-[state=checked]:bg-[#b5103c] data-[state=checked]:border-[#b5103c]",
                  isPartiallySelected && !isAllSelected && "bg-[#b5103c]/50 border-[#b5103c]"
                )}
              />
            </TableHead>
            <TableHead className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>ID</TableHead>
            <TableHead className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Nome do Paciente</TableHead>
            <TableHead className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Telefone</TableHead>
            <TableHead className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Instagram</TableHead>
            <TableHead className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Data do Exame</TableHead>
            <TableHead className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Cidade</TableHead>
            <TableHead className={cn("w-24", isDarkMode ? "text-gray-300" : "text-gray-700")}>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => (
            <TableRow 
              key={exam.id}
              className={cn(
                "transition-colors",
                selectedExams.includes(exam.id) && "bg-[#b5103c]/10",
                isDarkMode 
                  ? "hover:bg-[#2a2a2a] border-[#3f3f46]" 
                  : "hover:bg-slate-50 border-slate-200"
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedExams.includes(exam.id)}
                  onCheckedChange={() => onExamSelect(exam.id)}
                  className="data-[state=checked]:bg-[#b5103c] data-[state=checked]:border-[#b5103c]"
                />
              </TableCell>
              <TableCell className={cn("font-mono text-xs", isDarkMode ? "text-gray-300" : "text-gray-900")}>
                #{exam.id.slice(0, 8)}
              </TableCell>
              <TableCell className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                {exam.name}
              </TableCell>
              <TableCell className={cn(isDarkMode ? "text-gray-300" : "text-gray-900")}>{exam.phone}</TableCell>
              <TableCell className={cn(isDarkMode ? "text-gray-300" : "text-gray-900")}>
                {exam.instagram ? `@${exam.instagram}` : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className={cn("w-4 h-4 mr-2", isDarkMode ? "text-gray-400" : "text-gray-500")} />
                  <span className={cn(isDarkMode ? "text-gray-300" : "text-gray-900")}>
                    {new Date(exam.appointmentDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </TableCell>
              <TableCell className={cn(isDarkMode ? "text-gray-300" : "text-gray-900")}>{exam.city}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(exam)}
                  className={cn(
                    "h-8 w-8 p-0",
                    isDarkMode 
                      ? "border-[#3f3f46] text-gray-300 hover:bg-[#2a2a2a] hover:text-white" 
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {exams.length === 0 && (
        <div className={cn(
          "text-center py-8",
          isDarkMode ? "text-gray-400" : "text-slate-500"
        )}>
          {showWeekFilter ? "Nenhum exame encontrado para esta semana" : "Nenhum exame cadastrado"}
        </div>
      )}
    </div>
  );
};
