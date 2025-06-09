
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Search, Filter, Plus, Trash2 } from 'lucide-react';

interface ExamFiltersWeekProps {
  isDarkMode: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  showWeekFilter: boolean;
  onToggleWeekFilter: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onAddNew: () => void;
}

export const ExamFiltersWeek: React.FC<ExamFiltersWeekProps> = ({
  isDarkMode,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  showWeekFilter,
  onToggleWeekFilter,
  selectedCount,
  onDeleteSelected,
  onAddNew
}) => {
  return (
    <div className="space-y-4">
      {/* Header com título e botões principais */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Gerenciamento de Exames
          </h1>
          <p className={cn(
            "text-lg mt-1",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Gerencie exames de vista de forma eficiente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <Button
              onClick={onDeleteSelected}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir ({selectedCount})
            </Button>
          )}
          
          <Button
            onClick={onAddNew}
            className="bg-[#b5103c] hover:bg-[#8a0c2e] text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Exame
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className={cn(
        "p-4 rounded-lg border",
        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      )}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, telefone ou cidade..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(
                  "pl-10",
                  isDarkMode 
                    ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
                    : "bg-white border-slate-300"
                )}
              />
            </div>
          </div>
          
          {/* Filtros de Status */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange('all')}
              className={cn(
                statusFilter === 'all' && "bg-[#b5103c] hover:bg-[#8a0c2e] text-white",
                isDarkMode && statusFilter !== 'all' && "border-slate-600 text-slate-300 hover:bg-slate-700"
              )}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'agendado' ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange('agendado')}
              className={cn(
                statusFilter === 'agendado' && "bg-[#b5103c] hover:bg-[#8a0c2e] text-white",
                isDarkMode && statusFilter !== 'agendado' && "border-slate-600 text-slate-300 hover:bg-slate-700"
              )}
            >
              Agendados
            </Button>
            <Button
              variant={statusFilter === 'realizado' ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange('realizado')}
              className={cn(
                statusFilter === 'realizado' && "bg-[#b5103c] hover:bg-[#8a0c2e] text-white",
                isDarkMode && statusFilter !== 'realizado' && "border-slate-600 text-slate-300 hover:bg-slate-700"
              )}
            >
              Realizados
            </Button>
            
            {/* Separador */}
            <div className={cn(
              "w-px h-8 mx-2",
              isDarkMode ? "bg-slate-600" : "bg-slate-300"
            )} />
            
            {/* Filtro Semanal */}
            <Button
              variant={showWeekFilter ? "default" : "outline"}
              size="sm"
              onClick={onToggleWeekFilter}
              className={cn(
                "flex items-center gap-2",
                showWeekFilter && "bg-[#b5103c] hover:bg-[#8a0c2e] text-white",
                isDarkMode && !showWeekFilter && "border-slate-600 text-slate-300 hover:bg-slate-700"
              )}
            >
              <Calendar className="w-4 h-4" />
              Ver Exames da Semana
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
