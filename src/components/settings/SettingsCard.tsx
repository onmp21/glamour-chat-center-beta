
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  isDarkMode: boolean;
  badge?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  isDarkMode,
  badge
}) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] relative",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" : "bg-white border-gray-200 hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
          )}>
            <Icon size={20} className="text-[#b5103c]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={cn("font-medium text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
                {title}
              </h3>
              {badge && (
                <span className="bg-[#b5103c] text-white text-xs px-2 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className={cn("text-xs leading-relaxed", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
