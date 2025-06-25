
import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { useLayout } from '@/components/layout/LayoutProvider';

const Index = () => {
  const { isDarkMode } = useLayout();
  
  return (
    <Dashboard isDarkMode={isDarkMode} onSectionSelect={() => {}} />
  );
};

export default Index;
