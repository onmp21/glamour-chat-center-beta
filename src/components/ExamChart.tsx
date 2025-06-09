
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ExamWeeklyChart } from './ExamWeeklyChart';

interface ExamChartProps {
  isDarkMode: boolean;
}

export const ExamChart: React.FC<ExamChartProps> = ({ isDarkMode }) => {
  const [selectedCity, setSelectedCity] = useState<string>('todas');
  
  const data = [
    { month: 'Jan', exams: 45 },
    { month: 'Fev', exams: 52 },
    { month: 'Mar', exams: 48 },
    { month: 'Abr', exams: 61 },
    { month: 'Mai', exams: 55 },
    { month: 'Jun', exams: 67 },
  ];

  const cities = [
    { value: 'todas', label: 'Todas as Cidades' },
    { value: 'canarana', label: 'Canarana' },
    { value: 'souto-soares', label: 'Souto Soares' },
    { value: 'joao-dourado', label: 'João Dourado' },
    { value: 'america-dourada', label: 'América Dourada' }
  ];

  const filteredData = selectedCity === 'todas' 
    ? data 
    : data.map(item => ({ ...item, exams: Math.floor(item.exams * 0.8) })); // Simula filtro por cidade

  return (
    <div className="space-y-6">
      {/* Filtro por Cidade */}
      <div className="flex items-center space-x-4">
        <label className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Filtrar por Cidade:
        </label>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-48" style={{
            backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff',
            borderColor: isDarkMode ? '#686868' : '#d1d5db',
            color: isDarkMode ? '#ffffff' : '#111827'
          }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gráfico Mensal */}
      <div className={cn(
        "p-4 rounded-lg border"
      )} style={{
        backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff',
        borderColor: isDarkMode ? '#686868' : '#e5e7eb'
      }}>
        <h3 className={cn(
          "text-lg font-semibold mb-4",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Exames por Mês {selectedCity !== 'todas' && `- ${cities.find(c => c.value === selectedCity)?.label}`}
        </h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? '#686868' : '#e5e7eb'} 
              />
              <XAxis 
                dataKey="month" 
                stroke={isDarkMode ? '#a1a1aa' : '#6b7280'}
                fontSize={12}
              />
              <YAxis 
                stroke={isDarkMode ? '#a1a1aa' : '#6b7280'}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#686868' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
              <Bar 
                dataKey="exams" 
                fill="#b5103c" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Semanal */}
      <ExamWeeklyChart isDarkMode={isDarkMode} selectedCity={selectedCity} />
    </div>
  );
};
