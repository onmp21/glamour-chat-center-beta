
import React from "react";
import { cn } from "@/lib/utils";
import { Pin } from "lucide-react";

interface ChannelCardProps {
  name: string;
  subtitle?: string;
  status?: "online" | "offline";
  count?: number;
  instagram?: string;
  isDarkMode?: boolean;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  name,
  count,
  isDarkMode,
  onClick,
  compact = true,
  className,
  isPinned = false,
  onTogglePin
}) => {
  // Cores minimalistas baseadas em modo
  const bg = isDarkMode ? "#18181b" : "#f9fafb";
  const border = isDarkMode ? "#3f3f46" : "#e5e7eb";
  const colorTitle = isDarkMode ? "text-white" : "text-gray-900";
  const colorSub = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textCount = count !== undefined ? `${count} conversas` : "";

  const isHorizontal = className?.includes('flex-row');

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full border transition-all duration-200 cursor-pointer relative group mono-fade-in card-animate",
        isHorizontal 
          ? "flex items-center justify-between p-4 rounded-lg space-x-4"
          : "flex flex-col items-center justify-center rounded-lg p-4 min-h-[80px] text-center space-y-2",
        className
      )}
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <div className={cn(
        isHorizontal 
          ? "flex items-center space-x-3 flex-1 text-left"
          : "flex flex-col items-center space-y-1 flex-1 justify-center"
      )}>
        <div className={cn("font-medium", isHorizontal ? "text-base" : "text-sm", colorTitle)}>
          {name}
        </div>
        <span className={cn("text-sm", colorSub)}>
          {textCount}
        </span>
      </div>
      
      {onTogglePin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0 btn-animate",
            isPinned && "opacity-100",
            isHorizontal ? "ml-2" : "absolute top-2 right-2",
            isDarkMode ? "hover:bg-zinc-700" : "hover:bg-gray-200"
          )}
        >
          <Pin 
            size={12} 
            className={cn(
              isPinned ? "text-[#b5103c] fill-current" : (isDarkMode ? "text-gray-400" : "text-gray-600")
            )} 
          />
        </button>
      )}
    </button>
  );
};
