
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ExamWeeklyChartProps {
  isDarkMode: boolean;
  selectedCity?: string;
}

export const ExamWeeklyChart: React.FC<ExamWeeklyChartProps> = ({ isDarkMode, selectedCity }) => {
  const data = [
    { week: 'Sem 1', exams: 12 },
    { week: 'Sem 2', exams: 15 },
    { week: 'Sem 3', exams: 18 },
    { week: 'Sem 4', exams: 14 },
    { week: 'Sem 5', exams: 20 },
    { week: 'Sem 6', exams: 16 },
  ];

  const filteredData = selectedCity && selectedCity !== 'todas' 
    ? data.map(item => ({ ...item, exams: Math.floor(item.exams * 0.7) })) // Simula filtro por cidade
    : data;

  return (
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
        Exames por Semana {selectedCity && selectedCity !== 'todas' && `- ${selectedCity}`}
      </h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#686868' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="week" 
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
              fill="#059669" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
