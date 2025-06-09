
import React from 'react';
import { ReportsModern } from './ReportsModern';

interface ReportsNewProps {
  isDarkMode?: boolean;
}

export const ReportsNew: React.FC<ReportsNewProps> = ({ isDarkMode = false }) => {
  return <ReportsModern isDarkMode={isDarkMode} />;
};
