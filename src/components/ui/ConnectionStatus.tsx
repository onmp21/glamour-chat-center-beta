import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  status?: 'connected' | 'disconnected' | 'reconnecting';
  className?: string;
  showLabel?: boolean;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status = 'connected',
  className = '',
  showLabel = true,
  onReconnect
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState(status);
  
  // Monitorar status de conexão do navegador
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Atualizar status com base na prop e no estado online
  useEffect(() => {
    if (!isOnline) {
      setConnectionStatus('disconnected');
    } else if (status === 'reconnecting') {
      setConnectionStatus('reconnecting');
    } else {
      setConnectionStatus('connected');
    }
  }, [isOnline, status]);
  
  // Configurações de estilo e conteúdo com base no status
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          label: 'Conectado',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'reconnecting':
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />,
          label: 'Reconectando...',
          className: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4 text-red-500" />,
          label: 'Desconectado',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          label: 'Conectado',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${config.className} ${className}`}
      onClick={connectionStatus === 'disconnected' ? onReconnect : undefined}
      role={connectionStatus === 'disconnected' && onReconnect ? 'button' : undefined}
    >
      {config.icon}
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </div>
  );
};

export default ConnectionStatus;

