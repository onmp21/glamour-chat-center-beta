import React, { useState, useEffect } from 'react';
import { DetailedLogger, LogEntry, LogFilter, LogLevel } from '@/services/DetailedLogger';
import { Search, Filter, RefreshCw, Download, Trash2 } from 'lucide-react';

interface LogViewerProps {
  initialFilter?: LogFilter;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  initialFilter = {},
  maxHeight = '500px',
  autoRefresh = false,
  refreshInterval = 5000,
  className = '',
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Carregar logs com filtros aplicados
  const loadLogs = () => {
    const filteredLogs = DetailedLogger.getLogs({
      ...filter,
      searchTerm: searchTerm || undefined
    });
    setLogs(filteredLogs);
  };
  
  // Carregar logs iniciais
  useEffect(() => {
    loadLogs();
    
    // Configurar auto-refresh se habilitado
    let intervalId: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      intervalId = setInterval(loadLogs, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [filter, searchTerm, autoRefresh, refreshInterval]);
  
  // Exportar logs
  const handleExport = () => {
    const logsJson = DetailedLogger.exportLogs({
      ...filter,
      searchTerm: searchTerm || undefined
    });
    
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Limpar logs
  const handleClearLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs?')) {
      DetailedLogger.clearLogs();
      setLogs([]);
    }
  };
  
  // Renderizar nível de log com cor apropriada
  const renderLogLevel = (level: LogLevel) => {
    const levelConfig = {
      [LogLevel.DEBUG]: { bg: 'bg-gray-100', text: 'text-gray-800' },
      [LogLevel.INFO]: { bg: 'bg-blue-100', text: 'text-blue-800' },
      [LogLevel.WARN]: { bg: 'bg-amber-100', text: 'text-amber-800' },
      [LogLevel.ERROR]: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    
    const config = levelConfig[level];
    
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {level.toUpperCase()}
      </span>
    );
  };
  
  return (
    <div className={`flex flex-col border rounded-md bg-white ${className}`}>
      {/* Cabeçalho e controles */}
      <div className="p-3 border-b flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Logs do Sistema</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadLogs}
              className="p-1.5 rounded hover:bg-gray-100"
              title="Atualizar logs"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 rounded ${isFilterOpen ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              title="Filtrar logs"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button 
              onClick={handleExport}
              className="p-1.5 rounded hover:bg-gray-100"
              title="Exportar logs"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={handleClearLogs}
              className="p-1.5 rounded hover:bg-gray-100 text-red-500"
              title="Limpar logs"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 border rounded-md text-sm"
          />
        </div>
        
        {/* Filtros avançados */}
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            <div>
              <label className="block text-xs font-medium mb-1">Nível</label>
              <select
                value={filter.level || ''}
                onChange={(e) => setFilter({...filter, level: e.target.value as LogLevel || undefined})}
                className="w-full p-1.5 border rounded-md text-sm"
              >
                <option value="">Todos</option>
                <option value={LogLevel.DEBUG}>Debug</option>
                <option value={LogLevel.INFO}>Info</option>
                <option value={LogLevel.WARN}>Warn</option>
                <option value={LogLevel.ERROR}>Error</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Categoria</label>
              <input
                type="text"
                placeholder="Nome da categoria"
                value={filter.category || ''}
                onChange={(e) => setFilter({...filter, category: e.target.value || undefined})}
                className="w-full p-1.5 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Canal</label>
              <input
                type="text"
                placeholder="ID do canal"
                value={filter.channelId || ''}
                onChange={(e) => setFilter({...filter, channelId: e.target.value || undefined})}
                className="w-full p-1.5 border rounded-md text-sm"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Lista de logs */}
      <div 
        className="overflow-auto p-0"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhum log encontrado com os filtros atuais.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensagem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {renderLogLevel(log.level)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    {log.category}
                    {log.channelId && <span className="ml-1 text-xs text-gray-500">({log.channelId})</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900">
                    <div>
                      {log.message}
                      {log.data && (
                        <pre className="mt-1 text-xs bg-gray-50 p-1 rounded overflow-auto max-w-xs">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Rodapé com estatísticas */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500">
        {logs.length} logs exibidos
      </div>
    </div>
  );
};

export default LogViewer;

