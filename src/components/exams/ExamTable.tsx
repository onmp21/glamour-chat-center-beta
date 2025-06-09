
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
      isDarkMode ? "border-slate-700" : "border-slate-200"
    )}>
      <Table>
        <TableHeader>
          <TableRow className={cn(
            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
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
            <TableHead>ID</TableHead>
            <TableHead>Nome do Paciente</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead>Data do Exame</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead className="w-24">Ações</TableHead>
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
                  ? "hover:bg-slate-800 border-slate-700" 
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
              <TableCell className="font-mono text-xs">
                #{exam.id.slice(0, 8)}
              </TableCell>
              <TableCell className="font-medium">
                {exam.name}
              </TableCell>
              <TableCell>{exam.phone}</TableCell>
              <TableCell>
                {exam.instagram ? `@${exam.instagram}` : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {new Date(exam.appointmentDate).toLocaleDateString('pt-BR')}
                </div>
              </TableCell>
              <TableCell>{exam.city}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(exam)}
                  className="h-8 w-8 p-0"
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
          isDarkMode ? "text-slate-400" : "text-slate-500"
        )}>
          {showWeekFilter ? "Nenhum exame encontrado para esta semana" : "Nenhum exame cadastrado"}
        </div>
      )}
    </div>
  );
};
