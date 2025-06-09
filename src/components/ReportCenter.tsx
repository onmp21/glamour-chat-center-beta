import React from 'react';
import { ReportDashboardEnhanced } from './reports/ReportDashboardEnhanced';
import { useTheme } from '../hooks/useTheme';

export const ReportCenter: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="min-h-screen">
      <ReportDashboardEnhanced isDarkMode={isDarkMode} />
    </div>
  );
};

