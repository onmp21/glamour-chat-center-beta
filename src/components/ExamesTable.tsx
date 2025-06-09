import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ExamModal } from './ExamModal';
import { EditExamModal } from './EditExamModal';
import { ExamFilters } from './exams/ExamFilters';
import { ExamMobileCard } from './exams/ExamMobileCard';
import { ExamTableRow } from './exams/ExamTableRow';
import { ExamMultiSelectHeader } from './exams/ExamMultiSelectHeader';
import { cn } from '@/lib/utils';
import { useExams, Exam } from '@/hooks/useExams';

interface ExamesTableProps {
  isDarkMode: boolean;
}

export const ExamesTable: React.FC<ExamesTableProps> = ({ isDarkMode }) => {
  const { exams, loading, addExam, deleteExams, updateExam } = useExams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);

  const cities = ['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'];

  // Get current week range
  const getCurrentWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startOfWeek, endOfWeek };
  };

  const filteredExams = exams.filter(exam => {
    const searchRegex = new RegExp(searchTerm, 'i');
    const cityFilter = selectedCity === 'all' || exam.city === selectedCity;
    const searchFilter = searchRegex.test(exam.name) || searchRegex.test(exam.phone) || searchRegex.test(exam.instagram || '');
    
    if (showThisWeek) {
      const { startOfWeek, endOfWeek } = getCurrentWeekRange();
      const examDate = new Date(exam.appointmentDate);
      const weekFilter = examDate >= startOfWeek && examDate <= endOfWeek;
      return searchFilter && cityFilter && weekFilter;
    }
    
    return searchFilter && cityFilter;
  });

  const handleAddExam = () => {
    setIsAddExamModalOpen(true);
  };

  const handleExamSubmit = async (data: {
    name: string;
    phone: string;
    instagram?: string;
    city: string;
    appointmentDate: string;
  }) => {
    try {
      await addExam({
        name: data.name,
        phone: data.phone,
        instagram: data.instagram || null,
        city: data.city,
        appointmentDate: data.appointmentDate,
        status: 'agendado',
        examType: 'Exame de Vista',
        observations: null
      });
      console.log('Novo exame adicionado:', data);
    } catch (error) {
      console.error('Erro ao adicionar exame:', error);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setExamToEdit(exam);
    setIsEditExamModalOpen(true);
  };

  const handleEditExamSubmit = async (examId: string, data: {
    name: string;
    phone: string;
    instagram?: string;
    city: string;
    appointmentDate: string;
  }) => {
    try {
      await updateExam(examId, data);
      console.log('Exame atualizado:', examId, data);
      setIsEditExamModalOpen(false);
      setExamToEdit(null);
    } catch (error) {
      console.error('Erro ao atualizar exame:', error);
    }
  };

  const toggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedExams([]);
  };

  const toggleExamSelection = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const selectAllExams = () => {
    if (selectedExams.length === filteredExams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(filteredExams.map(exam => exam.id));
    }
  };

  const deleteSelectedExams = async () => {
    try {
      await deleteExams(selectedExams);
      setSelectedExams([]);
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('Erro ao excluir exames:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundColor: isDarkMode ? "#111112" : "#f9fafb"
      }}>
        <div className="text-lg">Carregando exames...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{
      backgroundColor: isDarkMode ? "#111112" : "#f9fafb"
    }}>
      {/* Header with Filters */}
      <ExamFilters
        isDarkMode={isDarkMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        showThisWeek={showThisWeek}
        setShowThisWeek={setShowThisWeek}
        isMultiSelectMode={isMultiSelectMode}
        toggleMultiSelect={toggleMultiSelect}
        selectedExams={selectedExams}
        deleteSelectedExams={deleteSelectedExams}
        handleAddExam={handleAddExam}
        cities={cities}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Mobile: Cards layout */}
        <div className="md:hidden space-y-3">
          {/* Multi-select header */}
          {isMultiSelectMode && (
            <ExamMultiSelectHeader
              isDarkMode={isDarkMode}
              selectedCount={selectedExams.length}
              totalCount={filteredExams.length}
              onSelectAll={selectAllExams}
            />
          )}
          
          {filteredExams.map((exam) => (
            <ExamMobileCard
              key={exam.id}
              exam={exam}
              isDarkMode={isDarkMode}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedExams.includes(exam.id)}
              onToggleSelection={() => toggleExamSelection(exam.id)}
              onEdit={() => handleEditExam(exam)}
            />
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden md:block">
          <Card className={cn(
            "border",
            isDarkMode ? "bg-[#1a1a1a] border-[#404040]" : "bg-white border-gray-200"
          )}>
            <CardHeader className="py-4 px-6">
              <CardTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                Lista de Exames de Vista {showThisWeek && '- Esta Semana'} ({filteredExams.length} exames)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ 
                  borderColor: isDarkMode ? "#404040" : "#e5e7eb" 
                }}>
                  <thead className={isDarkMode ? "bg-[#2a2a2a] text-white" : "bg-gray-50 text-gray-700"}>
                    <tr>
                      {isMultiSelectMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <Checkbox
                            checked={selectedExams.length === filteredExams.length && filteredExams.length > 0}
                            onCheckedChange={selectAllExams}
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Celular
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Instagram
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Data do Agendamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Cidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ 
                    borderColor: isDarkMode ? "#404040" : "#e5e7eb" 
                  }}>
                    {filteredExams.map((exam) => (
                      <ExamTableRow
                        key={exam.id}
                        exam={exam}
                        isDarkMode={isDarkMode}
                        isMultiSelectMode={isMultiSelectMode}
                        isSelected={selectedExams.includes(exam.id)}
                        onToggleSelection={() => toggleExamSelection(exam.id)}
                        onEdit={() => handleEditExam(exam)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        onSubmit={handleExamSubmit}
        isDarkMode={isDarkMode}
      />

      <EditExamModal
        isOpen={isEditExamModalOpen}
        onClose={() => {
          setIsEditExamModalOpen(false);
          setExamToEdit(null);
        }}
        onSubmit={handleEditExamSubmit}
        exam={examToEdit}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
