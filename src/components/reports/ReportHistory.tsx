
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReportHistory = ({ isDarkMode, recentReports, onViewReport, onDownloadReport }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div>
      <h2 className={cn(
        "text-xl font-semibold mb-4",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        Relatórios Recentes
      </h2>
      <ul className="grid gap-3">
        {recentReports.map(report => (
          <li key={report.id} className={cn(
            "flex items-center justify-between p-2 rounded transition-colors",
            isDarkMode 
              ? "bg-[#27272a] border border-[#3f3f46]" 
              : "bg-gray-100 border border-gray-200"
          )}>
            <span className={cn(
              "font-medium text-sm",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {report.title}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedReport(report);
                  if (typeof onViewReport === "function") onViewReport(report.result);
                }}
                className={cn(
                  "text-primary px-2 py-1 border rounded hover:bg-primary/10 transition",
                  isDarkMode 
                    ? "bg-[#18181b] border-[#3f3f46] hover:bg-primary/20" 
                    : "bg-white border-gray-300"
                )}
              >
                Ver
              </button>
              <button
                onClick={() => onDownloadReport(report.generated_report, report.report_type, report.id)}
                className={cn(
                  "text-xs hover:underline",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}
              >
                Download
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Modal simples para visualização de relatório */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className={cn(
            "max-w-lg w-full rounded shadow p-5",
            isDarkMode 
              ? "bg-[#18181b] border border-[#3f3f46]" 
              : "bg-white border border-gray-200"
          )}>
            <h3 className={cn(
              "font-semibold text-lg mb-2",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Relatório
            </h3>
            <pre className={cn(
              "overflow-x-auto max-h-96 rounded p-3 text-sm",
              isDarkMode 
                ? "bg-[#27272a] text-gray-300" 
                : "bg-gray-50 text-gray-900"
            )}>
              {selectedReport.generated_report || selectedReport.content}
            </pre>
            <button 
              className="mt-3 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors" 
              onClick={() => setSelectedReport(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
