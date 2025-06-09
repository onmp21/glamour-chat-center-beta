
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ExamMultiSelectHeaderProps {
  isDarkMode: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
}

export const ExamMultiSelectHeader: React.FC<ExamMultiSelectHeaderProps> = ({
  isDarkMode,
  selectedCount,
  totalCount,
  onSelectAll
}) => {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg" style={{
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6',
      borderColor: isDarkMode ? '#404040' : '#d1d5db'
    }}>
      <Checkbox
        checked={selectedCount === totalCount && totalCount > 0}
        onCheckedChange={onSelectAll}
      />
      <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
        Selecionar todos ({totalCount})
      </span>
    </div>
  );
};
