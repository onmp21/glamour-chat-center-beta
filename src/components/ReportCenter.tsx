
import React from 'react';
import { ReportDashboardEnhanced } from './reports/ReportDashboardEnhanced';
import { useTheme } from '@/components/theme-provider';

export const ReportCenter: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className="min-h-screen">
      <ReportDashboardEnhanced isDarkMode={isDarkMode} />
    </div>
  );
};
