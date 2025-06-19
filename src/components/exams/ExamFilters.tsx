
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, CalendarDays, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamFiltersProps {
  isDarkMode: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  showThisWeek: boolean;
  setShowThisWeek: (show: boolean) => void;
  isMultiSelectMode: boolean;
  toggleMultiSelect: () => void;
  selectedExams: string[];
  deleteSelectedExams: () => void;
  handleAddExam: () => void;
  cities: string[];
}

export const ExamFilters: React.FC<ExamFiltersProps> = ({
  isDarkMode,
  searchTerm,
  setSearchTerm,
  selectedCity,
  setSelectedCity,
  showThisWeek,
  setShowThisWeek,
  isMultiSelectMode,
  toggleMultiSelect,
  selectedExams,
  deleteSelectedExams,
  handleAddExam,
  cities
}) => {
  return (
    <div className={cn(
      "p-4 border-b",
      isDarkMode ? "border-border" : "border-gray-200"
    )}>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Button 
          onClick={() => setShowThisWeek(!showThisWeek)} 
          variant={showThisWeek ? "default" : "outline"} 
          className={cn(
            "flex items-center gap-2",
            showThisWeek 
              ? "bg-primary text-primary-foreground" 
              : isDarkMode 
                ? "border-border text-foreground hover:bg-accent" 
                : "border-gray-300 text-gray-700"
          )}
        >
          <CalendarDays size={16} className="text-primary" />
          {showThisWeek ? 'Mostrar Todos' : 'Exames da Semana'}
        </Button>
        
        <Button 
          onClick={toggleMultiSelect} 
          variant={isMultiSelectMode ? "default" : "outline"} 
          className={cn(
            "flex items-center gap-2",
            isMultiSelectMode 
              ? "bg-primary text-primary-foreground" 
              : isDarkMode 
                ? "border-border text-foreground hover:bg-accent" 
                : "border-gray-300 text-gray-700"
          )}
        >
          <CheckSquare size={16} className="text-primary" />
          {isMultiSelectMode ? 'Cancelar Seleção' : 'Seleção Múltipla'}
        </Button>
        
        {isMultiSelectMode && selectedExams.length > 0 && (
          <Button 
            onClick={deleteSelectedExams} 
            variant="outline" 
            className="flex items-center gap-2 text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 size={16} />
            Excluir ({selectedExams.length})
          </Button>
        )}
        
        <Button 
          onClick={handleAddExam} 
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus size={16} />
          Adicionar Exame
        </Button>
      </div>
      
      {/* Mobile: Filtros compactos */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por nome, telefone ou Instagram..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className={cn(
                "w-full",
                isDarkMode 
                  ? "bg-background border-border text-foreground placeholder:text-muted-foreground" 
                  : "bg-white border-gray-200"
              )} 
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "shrink-0",
              isDarkMode 
                ? "border-border text-foreground hover:bg-accent" 
                : "border-gray-300 text-gray-700"
            )}
          >
            <Filter size={16} className="text-primary" />
          </Button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button 
            variant={selectedCity === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedCity('all')} 
            className={cn(
              "whitespace-nowrap",
              selectedCity === 'all' 
                ? "bg-primary text-primary-foreground" 
                : isDarkMode 
                  ? "border-border text-foreground hover:bg-accent" 
                  : "border-gray-300 text-gray-700"
            )}
          >
            Todas
          </Button>
          {cities.map(city => (
            <Button 
              key={city} 
              variant={selectedCity === city ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedCity(city)} 
              className={cn(
                "whitespace-nowrap",
                selectedCity === city 
                  ? "bg-primary text-primary-foreground" 
                  : isDarkMode 
                    ? "border-border text-foreground hover:bg-accent" 
                    : "border-gray-300 text-gray-700"
              )}
            >
              {city}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop: Filtros em linha */}
      <div className="hidden md:flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
          <Input 
            placeholder="Buscar por nome, telefone ou Instagram..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className={cn(
              "pl-10",
              isDarkMode 
                ? "bg-background border-border text-foreground placeholder:text-muted-foreground" 
                : "bg-white border-gray-200"
            )} 
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={selectedCity === 'all' ? 'default' : 'outline'} 
            onClick={() => setSelectedCity('all')} 
            className={cn(
              selectedCity === 'all' 
                ? "bg-primary text-primary-foreground" 
                : isDarkMode 
                  ? "border-border text-foreground hover:bg-accent" 
                  : "border-gray-300 text-gray-700"
            )}
          >
            Todas as Cidades
          </Button>
          {cities.map(city => (
            <Button 
              key={city} 
              variant={selectedCity === city ? 'default' : 'outline'} 
              onClick={() => setSelectedCity(city)} 
              className={cn(
                selectedCity === city 
                  ? "bg-primary text-primary-foreground" 
                  : isDarkMode 
                    ? "border-border text-foreground hover:bg-accent" 
                    : "border-gray-300 text-gray-700"
              )}
            >
              {city}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
