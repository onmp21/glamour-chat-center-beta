
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  CalendarDays, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar 
} from 'lucide-react';
import { useExams, Exam } from '@/hooks/useExams';

interface ExamesTableProps {
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
}

export const ExamesTable: React.FC<ExamesTableProps> = ({ isDarkMode, onSectionChange }) => {
  const { exams, loading, deleteExam, deleteMultipleExams } = useExams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);

  // Corrigir nome da cidade America Dourada
  const cities = [...new Set(exams.map(exam => {
    // Corrigir possíveis variações do nome da cidade
    if (exam.city.toLowerCase().includes('amarica') || exam.city.toLowerCase().includes('america')) {
      return 'America Dourada';
    }
    return exam.city;
  }))];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.phone.includes(searchTerm) ||
      (exam.instagram && exam.instagram.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = selectedCity === 'all' || exam.city === selectedCity || 
      (selectedCity === 'America Dourada' && (exam.city.toLowerCase().includes('amarica') || exam.city.toLowerCase().includes('america')));
    
    let matchesWeek = true;
    if (showThisWeek) {
      const examDate = new Date(exam.appointmentDate);
      const today = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(today.getDate() + 7);
      matchesWeek = examDate >= today && examDate <= oneWeekFromNow;
    }
    
    return matchesSearch && matchesCity && matchesWeek;
  });

  const handleExamSelect = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExams.length === filteredExams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(filteredExams.map(exam => exam.id));
    }
  };

  const deleteSelectedExams = async () => {
    if (selectedExams.length > 0) {
      try {
        await deleteMultipleExams(selectedExams);
        setSelectedExams([]);
        setIsMultiSelectMode(false);
      } catch (error) {
        console.error('Erro ao excluir exames:', error);
      }
    }
  };

  const handleAddExam = () => {
    console.log('Adicionar exame clicado');
    // Implementar abertura do modal de adicionar exame
    // Por enquanto apenas log para debug
  };

  const handleEdit = (exam: Exam) => {
    console.log('Editar exame:', exam);
    // Implementar abertura do modal de editar exame
    // Por enquanto apenas log para debug
  };

  const toggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedExams([]);
  };

  if (loading) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        isDarkMode ? "bg-background" : "bg-gray-50"
      )}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className={cn(isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
            Carregando exames...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 overflow-auto p-4",
      isDarkMode ? "bg-background" : "bg-gray-50"
    )}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={cn(
            "text-2xl font-bold",
            isDarkMode ? "text-foreground" : "text-gray-900"
          )}>
            Exames
          </h1>
        </div>

        {/* Filters */}
        <div className={cn(
          "p-4 border rounded-lg",
          isDarkMode ? "border-border bg-card" : "border-gray-200 bg-white"
        )}>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button 
              onClick={() => setShowThisWeek(!showThisWeek)} 
              variant={showThisWeek ? "default" : "outline"} 
              className="flex items-center gap-2"
            >
              <CalendarDays size={16} />
              {showThisWeek ? 'Mostrar Todos' : 'Exames da Semana'}
            </Button>
            
            <Button 
              onClick={toggleMultiSelect} 
              variant={isMultiSelectMode ? "default" : "outline"} 
              className="flex items-center gap-2"
            >
              <CheckSquare size={16} />
              {isMultiSelectMode ? 'Cancelar Seleção' : 'Seleção Múltipla'}
            </Button>
            
            {isMultiSelectMode && selectedExams.length > 0 && (
              <Button 
                onClick={deleteSelectedExams} 
                variant="outline" 
                className="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} />
                Excluir ({selectedExams.length})
              </Button>
            )}
            
            <Button 
              onClick={handleAddExam} 
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Exame
            </Button>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome, telefone ou Instagram..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={selectedCity === 'all' ? 'default' : 'outline'} 
                onClick={() => setSelectedCity('all')} 
              >
                Todas as Cidades
              </Button>
              {cities.map(city => (
                <Button 
                  key={city} 
                  variant={selectedCity === city ? 'default' : 'outline'} 
                  onClick={() => setSelectedCity(city)} 
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={cn(
          "border rounded-lg overflow-hidden",
          isDarkMode ? "border-border" : "border-gray-200"
        )}>
          <Table>
            <TableHeader>
              <TableRow className={cn(
                isDarkMode ? "bg-muted/50 border-border" : "bg-gray-50 border-gray-200"
              )}>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredExams.length > 0 && selectedExams.length === filteredExams.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className={cn(isDarkMode ? "text-foreground" : "text-gray-700")}>ID</TableHead>
                <TableHead className={cn(isDarkMode ? "text-foreground" : "text-gray-700")}>Nome do Paciente</TableHead>
                <TableHead className={cn(isDarkMode ? "text-foreground" : "text-gray-700")}>Telefone</TableHead>
                <TableHead className={cn(isDarkMode ? "text-foreground" : "text-gray-700")}>Instagram</TableHead>
                <TableHead className={cn(isDarkMode ? "text-foreground" : "text-gray-700")}>Data do Exame</TableHead>
                <TableHead className={cn(isDarkMode ? "text-foreground" : "text-gray-700")}>Cidade</TableHead>
                <TableHead className={cn("w-24", isDarkMode ? "text-foreground" : "text-gray-700")}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow 
                  key={exam.id}
                  className={cn(
                    "transition-colors",
                    selectedExams.includes(exam.id) && "bg-primary/10",
                    isDarkMode 
                      ? "hover:bg-muted/50 border-border" 
                      : "hover:bg-gray-50 border-gray-200"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedExams.includes(exam.id)}
                      onCheckedChange={() => handleExamSelect(exam.id)}
                    />
                  </TableCell>
                  <TableCell className={cn("font-mono text-xs", isDarkMode ? "text-muted-foreground" : "text-gray-500")}>
                    #{exam.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className={cn("font-medium", isDarkMode ? "text-foreground" : "text-gray-900")}>
                    {exam.name}
                  </TableCell>
                  <TableCell className={cn(isDarkMode ? "text-foreground" : "text-gray-900")}>{exam.phone}</TableCell>
                  <TableCell className={cn(isDarkMode ? "text-foreground" : "text-gray-900")}>
                    {exam.instagram ? `@${exam.instagram}` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className={cn("w-4 h-4 mr-2", isDarkMode ? "text-muted-foreground" : "text-gray-500")} />
                      <span className={cn(isDarkMode ? "text-foreground" : "text-gray-900")}>
                        {new Date(exam.appointmentDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(isDarkMode ? "text-foreground" : "text-gray-900")}>
                    {exam.city.toLowerCase().includes('amarica') || exam.city.toLowerCase().includes('america') 
                      ? 'America Dourada' 
                      : exam.city}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(exam)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredExams.length === 0 && (
            <div className={cn(
              "text-center py-8",
              isDarkMode ? "text-muted-foreground" : "text-gray-500"
            )}>
              {showThisWeek ? "Nenhum exame encontrado para esta semana" : "Nenhum exame cadastrado"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
