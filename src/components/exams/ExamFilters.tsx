
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
    <div className="p-4 border-b" style={{
      borderColor: isDarkMode ? "#404040" : "#e5e7eb"
    }}>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Button 
          onClick={() => setShowThisWeek(!showThisWeek)} 
          variant={showThisWeek ? "default" : "outline"} 
          className="flex items-center gap-2" 
          style={{
            backgroundColor: showThisWeek ? '#b5103c' : 'transparent',
            borderColor: showThisWeek ? '#b5103c' : (isDarkMode ? '#404040' : '#d1d5db'),
            color: showThisWeek ? '#ffffff' : isDarkMode ? '#ffffff' : '#374151'
          }}
        >
          <CalendarDays size={16} className="text-[#b5103c]" />
          {showThisWeek ? 'Mostrar Todos' : 'Exames da Semana'}
        </Button>
        
        <Button 
          onClick={toggleMultiSelect} 
          variant={isMultiSelectMode ? "default" : "outline"} 
          className="flex items-center gap-2" 
          style={{
            backgroundColor: isMultiSelectMode ? '#b5103c' : 'transparent',
            borderColor: isMultiSelectMode ? '#b5103c' : (isDarkMode ? '#404040' : '#d1d5db'),
            color: isMultiSelectMode ? '#ffffff' : isDarkMode ? '#ffffff' : '#374151'
          }}
        >
          <CheckSquare size={16} className="text-[#b5103c]" />
          {isMultiSelectMode ? 'Cancelar Seleção' : 'Seleção Múltipla'}
        </Button>
        
        {isMultiSelectMode && selectedExams.length > 0 && (
          <Button 
            onClick={deleteSelectedExams} 
            variant="outline" 
            className="flex items-center gap-2 text-red-500 border-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Excluir ({selectedExams.length})
          </Button>
        )}
        
        <Button 
          onClick={handleAddExam} 
          className="flex items-center gap-2 bg-[#b5103c] hover:bg-[#9d0e35] text-white"
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
              className={cn("w-full", isDarkMode ? "bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-400" : "bg-white border-gray-200")} 
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0" style={{
            borderColor: isDarkMode ? '#404040' : '#d1d5db',
            color: isDarkMode ? '#ffffff' : '#374151'
          }}>
            <Filter size={16} className="text-[#b5103c]" />
          </Button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button 
            variant={selectedCity === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedCity('all')} 
            className="whitespace-nowrap" 
            style={{
              backgroundColor: selectedCity === 'all' ? '#b5103c' : 'transparent',
              borderColor: selectedCity === 'all' ? '#b5103c' : (isDarkMode ? '#404040' : '#d1d5db'),
              color: selectedCity === 'all' ? '#ffffff' : isDarkMode ? '#ffffff' : '#374151'
            }}
          >
            Todas
          </Button>
          {cities.map(city => (
            <Button 
              key={city} 
              variant={selectedCity === city ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedCity(city)} 
              className="whitespace-nowrap" 
              style={{
                backgroundColor: selectedCity === city ? '#b5103c' : 'transparent',
                borderColor: selectedCity === city ? '#b5103c' : (isDarkMode ? '#404040' : '#d1d5db'),
                color: selectedCity === city ? '#ffffff' : isDarkMode ? '#ffffff' : '#374151'
              }}
            >
              {city}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop: Filtros em linha */}
      <div className="hidden md:flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b5103c]" />
          <Input 
            placeholder="Buscar por nome, telefone ou Instagram..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className={cn("pl-10", isDarkMode ? "bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-400" : "bg-white border-gray-200")} 
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={selectedCity === 'all' ? 'default' : 'outline'} 
            onClick={() => setSelectedCity('all')} 
            style={{
              backgroundColor: selectedCity === 'all' ? '#b5103c' : 'transparent',
              borderColor: selectedCity === 'all' ? '#b5103c' : (isDarkMode ? '#404040' : '#d1d5db'),
              color: selectedCity === 'all' ? '#ffffff' : isDarkMode ? '#ffffff' : '#374151'
            }}
          >
            Todas as Cidades
          </Button>
          {cities.map(city => (
            <Button 
              key={city} 
              variant={selectedCity === city ? 'default' : 'outline'} 
              onClick={() => setSelectedCity(city)} 
              style={{
                backgroundColor: selectedCity === city ? '#b5103c' : 'transparent',
                borderColor: selectedCity === city ? '#b5103c' : (isDarkMode ? '#404040' : '#d1d5db'),
                color: selectedCity === city ? '#ffffff' : isDarkMode ? '#ffffff' : '#374151'
              }}
            >
              {city}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
