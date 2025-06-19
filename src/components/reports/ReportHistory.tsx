
import React, { useState } from 'react';
import { Download, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReportHistory = ({ isDarkMode, recentReports, onViewReport, onDownloadReport, onRemoveReport }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  const handleDownloadTxt = (content, reportType, reportId) => {
    // Create a blob with the content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${reportType}_${reportId}.txt`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRemove = (reportId) => {
    if (confirm('Tem certeza que deseja remover este relatório?')) {
      if (typeof onRemoveReport === "function") {
        onRemoveReport(reportId);
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div>
      <h2 className={cn(
        "text-xl font-semibold mb-4",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        Relatórios Recentes
      </h2>
      <ul className="grid gap-4">
        {recentReports.map(report => (
          <li key={report.id} className={cn(
            "flex flex-col p-5 rounded-lg transition-colors border",
            isDarkMode 
              ? "bg-card border-border" 
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                "font-medium text-base flex-1",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {report.title}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    if (typeof onViewReport === "function") onViewReport(report.result);
                  }}
                  className={cn(
                    "px-4 py-2 border rounded-md hover:bg-primary/10 transition-colors text-sm font-medium",
                    isDarkMode 
                      ? "bg-card border-border text-primary hover:bg-primary/20" 
                      : "bg-white border-gray-300 text-primary hover:bg-primary/5"
                  )}
                >
                  Ver
                </button>
                <button
                  onClick={() => handleDownloadTxt(report.generated_report, report.report_type, report.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-blue-50 transition-colors text-sm font-medium",
                    isDarkMode 
                      ? "bg-card border-border text-blue-400 hover:bg-blue-500/20" 
                      : "bg-white border-gray-300 text-blue-600 hover:bg-blue-50"
                  )}
                  title="Baixar como TXT"
                >
                  <Download size={16} />
                  TXT
                </button>
                <button
                  onClick={() => handleRemove(report.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-red-50 transition-colors text-sm font-medium",
                    isDarkMode 
                      ? "bg-card border-border text-red-400 hover:bg-red-500/20" 
                      : "bg-white border-gray-300 text-red-600 hover:bg-red-50"
                  )}
                  title="Remover relatório"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Data de criação */}
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              <Calendar size={14} />
              <span>Criado em: {formatDate(report.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Modal simples para visualização de relatório */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn(
            "max-w-2xl w-full mx-4 rounded-lg shadow-xl",
            isDarkMode 
              ? "bg-card border border-border" 
              : "bg-white border border-gray-200"
          )}>
            <div className={cn(
              "flex items-center justify-between p-6 border-b",
              isDarkMode ? "border-border" : "border-gray-200"
            )}>
              <h3 className={cn(
                "font-semibold text-xl",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Relatório
              </h3>
              <button 
                onClick={() => setSelectedReport(null)}
                className={cn(
                  "text-2xl font-light hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors",
                  isDarkMode ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:text-gray-700"
                )}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <pre className={cn(
                "overflow-auto max-h-96 rounded-lg p-4 text-sm whitespace-pre-wrap",
                isDarkMode 
                  ? "bg-muted text-foreground" 
                  : "bg-gray-50 text-gray-900"
              )}>
                {selectedReport.generated_report || selectedReport.content}
              </pre>
            </div>
            <div className={cn(
              "flex justify-end p-6 border-t",
              isDarkMode ? "border-border" : "border-gray-200"
            )}>
              <button 
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium" 
                onClick={() => setSelectedReport(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
