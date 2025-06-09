
import React, { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUnifiedContacts } from '@/hooks/useUnifiedContacts';
import { usePermissions } from '@/hooks/usePermissions';
import { ChannelSelectorModal } from './ChannelSelectorModal';

interface Contact {
  id: string;
  nome: string;
  telefone: string;
  canais: string[];
  ultimaMensagem: string;
  tempo: string;
  status: 'pendente' | 'em_andamento' | 'resolvida';
}

interface ContactsListOptimizedProps {
  contacts: Contact[];
  onContactClick: (contactId: string, canais: string[]) => void;
  isDarkMode: boolean;
}

// Memoizar item de contato para evitar re-renders desnecessários
const ContactItem = memo<{
  contact: Contact;
  onClick: () => void;
  isDarkMode: boolean;
}>(({ contact, onClick, isDarkMode }) => {
  const getChannelText = (canal: string) => {
    const mapping: Record<string, string> = {
      'whatsapp': 'Canarana',
      'canarana': 'Canarana',
      'souto-soares': 'Souto Soares',
      'joao-dourado': 'João Dourado',
      'america-dourada': 'América Dourada',
      'gerente-externo': 'Andressa Gerente',
      'gerente-lojas': 'Gustavo Gerente',
      'chat': 'Yelena-AI'
    };
    return mapping[canal.toLowerCase()] || canal;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-red-500',
      'em_andamento': 'bg-yellow-500',
      'resolvida': 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'em_andamento': 'Em Andamento',
      'resolvida': 'Resolvida'
    };
    return labels[status] || 'Desconhecido';
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" : "bg-white border-gray-200 hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
            )}>
              <Users size={16} className="text-[#b5103c]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn("font-medium text-sm truncate", isDarkMode ? "text-white" : "text-gray-900")}>
                  {contact.nome}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {contact.canais.map((canal, index) => (
                  <span 
                    key={index}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isDarkMode ? "bg-[#3f3f46] text-gray-300" : "bg-gray-200 text-gray-700"
                    )}
                  >
                    {getChannelText(canal)}
                  </span>
                ))}
              </div>
              <p className={cn("text-xs truncate mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                {contact.ultimaMensagem}
              </p>
              <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>
                {contact.telefone}
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              {contact.tempo}
            </span>
            <div className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(contact.status))}></div>
              <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                {getStatusLabel(contact.status)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContactItem.displayName = 'ContactItem';

export const ContactsListOptimized: React.FC<ContactsListOptimizedProps> = ({
  contacts: mockContacts,
  onContactClick,
  isDarkMode
}) => {
  // USAR O HOOK UNIFICADO em vez dos hooks antigos
  const { contacts: realContacts, loading, error, loadingProgress, refetch, hasChannels } = useUnifiedContacts();
  const { getAccessibleChannels } = usePermissions();
  const [selectedContact, setSelectedContact] = useState<{ phone: string; name: string; channels: string[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('🔍 [CONTACTS_LIST_OPTIMIZED] Hook state:', {
    realContactsCount: realContacts.length,
    loading,
    error,
    hasChannels
  });

  const handleContactClick = (contact: Contact) => {
    console.log('🔍 [CONTACTS_LIST] Contact clicked:', contact);
    
    if (!contact.telefone) {
      console.error('❌ [CONTACTS_LIST] Contact has no phone number:', contact);
      return;
    }

    if (contact.canais.length === 1) {
      const targetUrl = `/?section=mensagens&channel=${contact.canais[0]}&phone=${encodeURIComponent(contact.telefone)}`;
      console.log('🚀 [CONTACTS_LIST] Direct navigation to:', targetUrl);
      window.location.href = targetUrl;
    } else if (contact.canais.length > 1) {
      console.log('📋 [CONTACTS_LIST] Multiple channels, showing modal:', contact.canais);
      setSelectedContact({
        phone: contact.telefone,
        name: contact.nome,
        channels: contact.canais
      });
      setIsModalOpen(true);
    } else {
      console.error('❌ [CONTACTS_LIST] Contact has no channels:', contact);
    }
  };

  const handleChannelSelect = (channel: string) => {
    if (selectedContact) {
      const targetUrl = `/?section=mensagens&channel=${channel}&phone=${encodeURIComponent(selectedContact.phone)}`;
      console.log('🚀 [CONTACTS_LIST] Channel selected, navigating to:', targetUrl);
      window.location.href = targetUrl;
    }
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  // Mostrar loading com progresso otimizado
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b5103c]"></div>
            <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Carregando contatos...
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        {loadingProgress > 0 && (
          <Progress 
            value={loadingProgress} 
            className="w-full h-2"
          />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Users className={cn("mx-auto mb-4", isDarkMode ? "text-gray-600" : "text-gray-400")} size={48} />
        <p className={cn("text-lg font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
          Erro ao carregar contatos
        </p>
        <p className={cn("text-sm mb-4", isDarkMode ? "text-gray-400" : "text-gray-500")}>
          {error}
        </p>
        <Button 
          variant="outline" 
          onClick={refetch}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Verificar permissões antes de decidir quais contatos mostrar
  const accessibleChannels = getAccessibleChannels();
  const hasPermissions = accessibleChannels.length > 0;
  
  console.log('🔐 [CONTACTS_LIST] Permission check:', {
    hasChannels,
    hasPermissions,
    accessibleChannels,
    realContactsCount: realContacts.length,
    willShowReal: hasChannels && hasPermissions && realContacts.length > 0
  });

  // MOSTRAR APENAS contatos reais se usuário tem permissões
  const displayContacts = (hasChannels && hasPermissions && realContacts.length > 0) ? realContacts : [];

  return (
    <>
      <div className="space-y-2">
        {displayContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className={cn("mx-auto mb-4", isDarkMode ? "text-gray-600" : "text-gray-400")} size={48} />
            <p className={cn("text-lg font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              {!hasPermissions ? "Sem permissão para visualizar contatos" : "Nenhum contato encontrado"}
            </p>
            <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              {!hasPermissions 
                ? "Entre em contato com o administrador para obter acesso" 
                : "Os contatos aparecerão aqui quando houver conversas"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className={cn("text-sm font-medium", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                {realContacts.length} contatos encontrados
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Atualizar
              </Button>
            </div>
            {displayContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                onClick={() => handleContactClick(contact)}
                isDarkMode={isDarkMode}
              />
            ))}
          </>
        )}
      </div>

      <ChannelSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChannelSelect={handleChannelSelect}
        contactName={selectedContact?.name || ''}
        availableChannels={selectedContact?.channels || []}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
