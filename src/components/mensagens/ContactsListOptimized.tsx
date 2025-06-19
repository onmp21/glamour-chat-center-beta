
import React from 'react';
import { cn } from '@/lib/utils';
import { OptimizedContact } from '@/services/OptimizedContactService';
import { useUnifiedContacts } from '@/hooks/useUnifiedContacts';
import { getChannelDisplayNameSync } from '@/utils/channelMapping';

interface ContactsListOptimizedProps {
  contacts?: OptimizedContact[];
  onContactClick: (contact: OptimizedContact) => void;
  isDarkMode: boolean;
}

export const ContactsListOptimized: React.FC<ContactsListOptimizedProps> = ({
  contacts: propContacts,
  onContactClick,
  isDarkMode
}) => {
  // Usar hook unificado para carregar contatos de todos os canais
  const { contacts: hookContacts, loading, error, loadingProgress } = useUnifiedContacts();
  
  // Usar contatos do hook se não foram passados como prop
  const contacts = propContacts || hookContacts;

  const formatTimeAgo = (tempo: string): string => {
    if (!tempo) return '';
    return tempo;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500';
      case 'em_andamento':
        return 'bg-blue-500';
      case 'resolvida':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'resolvida':
        return 'Resolvida';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        <div className={cn(
          "animate-spin rounded-full h-8 w-8 border-b-2 mb-4",
          isDarkMode ? "border-white" : "border-gray-900"
        )}></div>
        <p>Carregando contatos...</p>
        {loadingProgress > 0 && (
          <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-[#b5103c] h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12",
        "text-red-500"
      )}>
        <p className="font-medium">Erro ao carregar contatos</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        <div className="text-4xl mb-4">👥</div>
        <p className="font-medium">Nenhum contato encontrado</p>
        <p className="text-sm mt-1">Os contatos aparecerão aqui quando houver conversas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => onContactClick(contact)}
          className={cn(
            "p-4 rounded-lg border transition-all cursor-pointer",
            isDarkMode
              ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]"
              : "bg-white border-gray-200 hover:bg-gray-50",
            "hover:scale-[1.02] hover:shadow-md"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "font-medium text-sm truncate",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {contact.nome}
                </h3>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(contact.status)
                )}></div>
              </div>
              
              <p className={cn(
                "text-xs mb-1",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                📞 {contact.telefone}
              </p>
              
              <p className={cn(
                "text-xs truncate mb-2",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                {contact.ultimaMensagem}
              </p>
              
              {contact.canais && contact.canais.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {contact.canais.map((canal, index) => (
                    <span
                      key={index}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        isDarkMode
                          ? "bg-[#27272a] text-gray-300"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {getChannelDisplayNameSync(canal)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                {formatTimeAgo(contact.tempo)}
              </span>
              
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                contact.status === 'pendente' && "bg-yellow-100 text-yellow-800",
                contact.status === 'em_andamento' && "bg-blue-100 text-blue-800",
                contact.status === 'resolvida' && "bg-green-100 text-green-800",
                isDarkMode && contact.status === 'pendente' && "bg-yellow-900 text-yellow-200",
                isDarkMode && contact.status === 'em_andamento' && "bg-blue-900 text-blue-200",
                isDarkMode && contact.status === 'resolvida' && "bg-green-900 text-green-200"
              )}>
                {getStatusText(contact.status)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
