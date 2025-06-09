
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Phone, Instagram, User, Edit, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Exam } from '@/hooks/useExams';

interface ExamMobileCardProps {
  exam: Exam;
  isDarkMode: boolean;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onEdit: () => void;
}

export const ExamMobileCard: React.FC<ExamMobileCardProps> = ({
  exam,
  isDarkMode,
  isMultiSelectMode,
  isSelected,
  onToggleSelection,
  onEdit
}) => {
  return (
    <Card 
      className={cn(
        "border transition-all duration-200 hover:shadow-md",
        isDarkMode ? "bg-[#1a1a1a] border-[#404040]" : "bg-white border-gray-200",
        isSelected && "ring-2 ring-[#b5103c]"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isMultiSelectMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelection}
              />
            )}
            <User size={16} className="text-[#b5103c]" />
            <span className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              {exam.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              #{exam.id.slice(0, 8)}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="p-1 h-8 w-8"
            >
              <Edit size={14} />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={14} className="text-gray-400" />
            <span className={cn(isDarkMode ? "text-gray-200" : "text-gray-600")}>
              {exam.phone}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Instagram size={14} className="text-gray-400" />
            <span className={cn(isDarkMode ? "text-gray-200" : "text-gray-600")}>
              {exam.instagram}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-gray-400" />
            <span className={cn(isDarkMode ? "text-gray-200" : "text-gray-600")}>
              {exam.city}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-gray-400" />
            <span className={cn(isDarkMode ? "text-gray-200" : "text-gray-600")}>
              {new Date(exam.appointmentDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
