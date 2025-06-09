
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Exam } from '@/hooks/useExams';

const editExamFormSchema = z.object({
  pacienteName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  celular: z.string().min(10, 'Celular deve ter pelo menos 10 dígitos'),
  instagram: z.string().optional(),
  cidade: z.enum(['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada']),
  dataAgendamento: z.date({ required_error: 'Data de agendamento é obrigatória' })
});

type EditExamFormData = z.infer<typeof editExamFormSchema>;

interface EditExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (examId: string, data: {
    name: string;
    phone: string;
    instagram?: string;
    city: string;
    appointmentDate: string;
  }) => void;
  exam: Exam | null;
  isDarkMode: boolean;
}

export const EditExamModal: React.FC<EditExamModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  exam,
  isDarkMode 
}) => {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<EditExamFormData>({
    resolver: zodResolver(editExamFormSchema)
  });

  const selectedDate = watch('dataAgendamento');

  useEffect(() => {
    if (exam) {
      setValue('pacienteName', exam.name);
      setValue('celular', exam.phone);
      setValue('instagram', exam.instagram);
      setValue('cidade', exam.city as any);
      setValue('dataAgendamento', new Date(exam.appointmentDate));
    }
  }, [exam, setValue]);

  const handleFormSubmit = (data: EditExamFormData) => {
    if (exam) {
      onSubmit(exam.id, {
        name: data.pacienteName,
        phone: data.celular,
        instagram: data.instagram,
        city: data.cidade,
        appointmentDate: data.dataAgendamento.toISOString().split('T')[0]
      });
      onClose();
    }
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  if (!exam) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-md"
      )} style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#404040' : '#e5e7eb'
      }}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-xl font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Editar Exame
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pacienteName" className={cn(
              isDarkMode ? "text-gray-200" : "text-gray-700"
            )}>
              Nome do Paciente
            </Label>
            <Input
              id="pacienteName"
              {...register('pacienteName')}
              style={{
                backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                borderColor: isDarkMode ? '#404040' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            />
            {errors.pacienteName && (
              <p className="text-sm" style={{ color: '#b5103c' }}>{errors.pacienteName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="celular" className={cn(
              isDarkMode ? "text-gray-200" : "text-gray-700"
            )}>
              Celular
            </Label>
            <Input
              id="celular"
              {...register('celular')}
              onChange={(e) => {
                const formatted = formatCelular(e.target.value);
                e.target.value = formatted;
                register('celular').onChange(e);
              }}
              placeholder="(77) 99999-9999"
              style={{
                backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                borderColor: isDarkMode ? '#404040' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            />
            {errors.celular && (
              <p className="text-sm" style={{ color: '#b5103c' }}>{errors.celular.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className={cn(
              isDarkMode ? "text-gray-200" : "text-gray-700"
            )}>
              Instagram (Opcional)
            </Label>
            <Input
              id="instagram"
              {...register('instagram')}
              placeholder="@nomedeusuario"
              style={{
                backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                borderColor: isDarkMode ? '#404040' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            />
            {errors.instagram && (
              <p className="text-sm" style={{ color: '#b5103c' }}>{errors.instagram.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade" className={cn(
              isDarkMode ? "text-gray-200" : "text-gray-700"
            )}>
              Cidade
            </Label>
            <select
              {...register('cidade')}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                borderColor: isDarkMode ? '#404040' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            >
              <option value="Canarana">Canarana</option>
              <option value="Souto Soares">Souto Soares</option>
              <option value="João Dourado">João Dourado</option>
              <option value="América Dourada">América Dourada</option>
            </select>
            {errors.cidade && (
              <p className="text-sm" style={{ color: '#b5103c' }}>{errors.cidade.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className={cn(
              isDarkMode ? "text-gray-200" : "text-gray-700"
            )}>
              Data de Agendamento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  style={{
                    backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                    borderColor: isDarkMode ? '#404040' : '#d1d5db',
                    color: isDarkMode ? '#ffffff' : '#111827'
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setValue('dataAgendamento', date!)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.dataAgendamento && (
              <p className="text-sm" style={{ color: '#b5103c' }}>{errors.dataAgendamento.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                borderColor: isDarkMode ? '#404040' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#374151'
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              style={{
                backgroundColor: '#b5103c',
                color: '#ffffff'
              }}
              className="hover:opacity-90"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
