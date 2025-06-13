
import React from 'react';
import { AIConfigSection } from './AIConfigSection';
import { ReportDashboardEnhanced } from './reports/ReportDashboardEnhanced';

export function MainApp() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Glamour Chat Center - LLM Integration</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <AIConfigSection />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ReportDashboardEnhanced isDarkMode={false} />
        </div>
      </div>
    </div>
  );
}
