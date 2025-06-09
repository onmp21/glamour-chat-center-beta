
import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, Zap, Bell } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ChannelsSidebarProps {
  isDarkMode: boolean;
  channels: Channel[];
  selectedCategory: 'all' | 'active' | 'inactive';
  onCategoryChange: (category: 'all' | 'active' | 'inactive') => void;
}

export const ChannelsSidebar: React.FC<ChannelsSidebarProps> = ({
  isDarkMode,
  channels,
  selectedCategory,
  onCategoryChange
}) => {
  const categories = [
    { id: 'all' as const, label: 'Todos', icon: Eye, count: channels.length },
    { id: 'active' as const, label: 'Ativos', icon: Zap, count: channels.filter(c => c.is_active).length },
    { id: 'inactive' as const, label: 'Inativos', icon: Bell, count: channels.filter(c => !c.is_active).length },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros por Categoria */}
      <div className={cn(
        "p-4 rounded-xl border",
        isDarkMode 
          ? "bg-[#18181b] border-[#3f3f46]" 
          : "bg-white border-gray-200 shadow-sm"
      )}>
        <h3 className={cn(
          "text-sm font-medium mb-3",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Filtros
        </h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-[#b5103c] text-white"
                  : isDarkMode
                    ? "hover:bg-[#27272a] text-gray-300"
                    : "hover:bg-gray-50 text-gray-700"
              )}
            >
              <div className="flex items-center gap-3">
                <category.icon size={16} />
                <span className="text-sm font-medium">{category.label}</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                selectedCategory === category.id
                  ? "bg-white/20 text-white"
                  : isDarkMode
                    ? "bg-[#3f3f46] text-gray-300"
                    : "bg-gray-100 text-gray-600"
              )}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className={cn(
        "p-4 rounded-xl border",
        isDarkMode 
          ? "bg-[#18181b] border-[#3f3f46]" 
          : "bg-white border-gray-200 shadow-sm"
      )}>
        <h3 className={cn(
          "text-sm font-medium mb-3",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Estatísticas
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Total
            </span>
            <span className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {channels.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Online
            </span>
            <span className="text-lg font-semibold text-green-500">
              {channels.filter(c => c.is_active).length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Offline
            </span>
            <span className="text-lg font-semibold text-red-500">
              {channels.filter(c => !c.is_active).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
