import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';

export interface Exam {
  id: string;
  name: string;
  phone: string;
  instagram: string | null;
  city: string;
  appointmentDate: string;
  status: string;
  examType: string;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar exames:', error);
        return;
      }

      const formattedExams: Exam[] = (data || []).map(exam => ({
        id: exam.id,
        name: exam.patient_name,
        phone: exam.phone,
        instagram: exam.instagram,
        city: exam.city,
        appointmentDate: exam.appointment_date,
        status: exam.status,
        examType: exam.exam_type,
        observations: exam.observations,
        createdAt: exam.created_at,
        updatedAt: exam.updated_at
      }));

      setExams(formattedExams);
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const createExam = async (examData: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          patient_name: examData.name,
          phone: examData.phone,
          instagram: examData.instagram,
          city: examData.city,
          appointment_date: examData.appointmentDate,
          status: examData.status,
          exam_type: examData.examType,
          observations: examData.observations
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar exame:', error);
        throw error;
      }

      await loadExams();
      return data;
    } catch (error) {
      console.error('Erro ao criar exame:', error);
      throw error;
    }
  };

  // Alias para compatibilidade
  const addExam = createExam;

  const updateExam = async (examId: string, examData: Partial<Exam>) => {
    try {
      const updateData: any = {};
      
      if (examData.name) updateData.patient_name = examData.name;
      if (examData.phone) updateData.phone = examData.phone;
      if (examData.instagram !== undefined) updateData.instagram = examData.instagram;
      if (examData.city) updateData.city = examData.city;
      if (examData.appointmentDate) updateData.appointment_date = examData.appointmentDate;
      if (examData.status) updateData.status = examData.status;
      if (examData.examType) updateData.exam_type = examData.examType;
      if (examData.observations !== undefined) updateData.observations = examData.observations;

      const { error } = await supabase
        .from('exams')
        .update(updateData)
        .eq('id', examId);

      if (error) {
        console.error('Erro ao atualizar exame:', error);
        throw error;
      }

      await loadExams();
    } catch (error) {
      console.error('Erro ao atualizar exame:', error);
      throw error;
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) {
        console.error('Erro ao excluir exame:', error);
        throw error;
      }

      await loadExams();
    } catch (error) {
      console.error('Erro ao excluir exame:', error);
      throw error;
    }
  };

  const deleteExams = async (examIds: string[]) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .in('id', examIds);

      if (error) {
        console.error('Erro ao excluir exames:', error);
        throw error;
      }

      await loadExams();
    } catch (error) {
      console.error('Erro ao excluir exames:', error);
      throw error;
    }
  };

  const getExamStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisWeek = exams.filter(exam => {
      const examDate = new Date(exam.appointmentDate);
      return examDate >= startOfWeek && examDate <= endOfWeek;
    }).length;

    const thisMonth = exams.filter(exam => {
      const examDate = new Date(exam.appointmentDate);
      return examDate >= startOfMonth && examDate <= endOfMonth;
    }).length;

    const byCity = exams.reduce((acc, exam) => {
      acc[exam.city] = (acc[exam.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: exams.length,
      thisWeek,
      thisMonth,
      byCity
    };
  };

  return {
    exams,
    loading,
    createExam,
    addExam, // Alias para compatibilidade
    updateExam,
    deleteExam,
    deleteExams, // Para deletar múltiplos exames
    getExamStats, // Para estatísticas do dashboard
    refreshExams: loadExams
  };
};
