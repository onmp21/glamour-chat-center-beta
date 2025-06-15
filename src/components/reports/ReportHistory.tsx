import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReportHistory = ({ isDarkMode, recentReports, onViewReport, onDownloadReport }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Relatórios Recentes
      </h2>
      <ul className="grid gap-3">
        {recentReports.map(report => (
          <li key={report.id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <span className="font-medium text-sm">{report.title}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedReport(report);
                  if (typeof onViewReport === "function") onViewReport(report.result);
                }}
                className="text-primary px-2 py-1 bg-white border rounded hover:bg-primary/10 transition"
              >
                Ver
              </button>
              <button
                onClick={() => onDownloadReport(report.generated_report, report.report_type, report.id)}
                className="text-xs text-gray-600 hover:underline"
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
          <div className="bg-white max-w-lg w-full rounded shadow p-5">
            <h3 className="font-semibold text-lg mb-2">Relatório</h3>
            <pre className="overflow-x-auto max-h-96 bg-gray-50 rounded p-3 text-sm">{selectedReport.generated_report || selectedReport.content}</pre>
            <button className="mt-3 px-4 py-2 bg-primary text-white rounded" onClick={() => setSelectedReport(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
