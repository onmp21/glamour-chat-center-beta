
import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  isDarkMode?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  isDarkMode,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-2xl p-5 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md",
        "border border-opacity-20",
        isDarkMode 
          ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 hover:from-gray-700 hover:to-gray-800" 
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:from-gray-50 hover:to-white"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "rounded-xl w-12 h-12 flex items-center justify-center text-xl shadow-inner",
          isDarkMode ? "bg-gray-700" : "bg-gray-100"
        )}>
          {icon}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className={cn(
            "text-base font-semibold leading-tight",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {title}
          </span>
          {subtitle && (
            <span className={cn(
              "text-sm mt-1 leading-tight",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <ChevronRight 
        size={20} 
        className={cn(
          "flex-shrink-0 transition-transform duration-200",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )} 
      />
    </button>
  );
};
