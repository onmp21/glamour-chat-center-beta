
import React from 'react';
import { ExamTableRow } from './ExamTableRow';
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

interface ExamesTableProps {
  exams: Exam[];
  isDarkMode: boolean;
  onExamClick: (exam: Exam) => void;
}

export const ExamesTable: React.FC<ExamesTableProps> = ({
  exams,
  isDarkMode,
  onExamClick
}) => {
  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn(
            "border-b",
            isDarkMode ? "bg-muted border-border" : "bg-gray-50 border-gray-200"
          )}>
            <tr>
              <th className={cn(
                "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>
                Paciente
              </th>
              <th className={cn(
                "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>
                Tipo de Exame
              </th>
              <th className={cn(
                "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>
                Data
              </th>
              <th className={cn(
                "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>
                Status
              </th>
              <th className={cn(
                "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                isDarkMode ? "text-muted-foreground" : "text-gray-500"
              )}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className={cn(
            "divide-y",
            isDarkMode ? "bg-card divide-border" : "bg-white divide-gray-200"
          )}>
            {exams.map((exam) => (
              <ExamTableRow
                key={exam.id}
                exam={exam}
                isDarkMode={isDarkMode}
                onClick={() => onExamClick(exam)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
