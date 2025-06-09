
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Mail, 
  MessageCircle, 
  Star,
  UserPlus,
  Phone
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  lastContact?: string;
  conversationCount: number;
  notes?: string;
  isFavorite: boolean;
  status: 'active' | 'inactive' | 'blocked';
}

interface ContactsPageLayoutProps {
  isDarkMode: boolean;
}

export const ContactsPageLayout: React.FC<ContactsPageLayoutProps> = ({
  isDarkMode
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Mock data
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'João Silva',
        phone: '(11) 99999-1234',
        email: 'joao@email.com',
        tags: ['cliente', 'vip'],
        lastContact: '2024-01-15T10:30:00Z',
        conversationCount: 15,
        notes: 'Cliente premium, compra regularmente',
        isFavorite: true,
        status: 'active'
      },
      {
        id: '2',
        name: 'Maria Santos',
        phone: '(11) 88888-5678',
        email: 'maria@email.com',
        tags: ['cliente'],
        lastContact: '2024-01-14T14:20:00Z',
        conversationCount: 8,
        notes: 'Interessada em promoções',
        isFavorite: false,
        status: 'active'
      },
      {
        id: '3',
        name: 'Pedro Costa',
        phone: '(11) 77777-9012',
        tags: ['potencial', 'lead'],
        lastContact: '2024-01-13T09:15:00Z',
        conversationCount: 3,
        isFavorite: false,
        status: 'active'
      }
    ];
    
    setContacts(mockContacts);
    setFilteredContacts(mockContacts);
  }, []);

  // Filtrar contatos
  useEffect(() => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(contact => 
        contact.tags.includes(selectedTag)
      );
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, selectedTag]);

  const toggleFavorite = (contactId: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, isFavorite: !contact.isFavorite }
        : contact
    ));
  };

  const allTags = [...new Set(contacts.flatMap(contact => contact.tags))];
  const favoriteContacts = filteredContacts.filter(c => c.isFavorite);
  const regularContacts = filteredContacts.filter(c => !c.isFavorite);

  const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
    <div
      className={cn(
        "group p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#b5103c]/20",
        isDarkMode 
          ? "bg-[#18181b] border-[#3f3f46] hover:border-[#b5103c]/50 hover:bg-[#27272a]" 
          : "bg-white border-gray-200 hover:border-[#b5103c]/50 hover:bg-gray-50"
      )}
      onClick={() => setSelectedContact(contact)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg",
            contact.status === 'active' ? "bg-[#b5103c]" :
            contact.status === 'inactive' ? "bg-gray-500" : "bg-red-600"
          )}>
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-lg group-hover:text-[#b5103c] transition-colors",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {contact.name}
              </h3>
              {contact.isFavorite && (
                <Star className="h-4 w-4 text-[#b5103c] fill-current" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Phone size={14} className="text-[#b5103c]" strokeWidth={1.5} />
              <span className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
              )}>
                {contact.phone}
              </span>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(contact.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star className={cn(
            "h-4 w-4",
            contact.isFavorite ? "text-[#b5103c] fill-current" : "text-gray-400"
          )} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="space-y-3">
        {contact.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#b5103c]" strokeWidth={1.5} />
            <span className={cn(
              "text-sm",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
            )}>
              {contact.email}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#b5103c]" strokeWidth={1.5} />
          <span className={cn(
            "text-sm font-medium",
            isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
          )}>
            {contact.conversationCount} conversas
          </span>
        </div>

        {contact.lastContact && (
          <div className="text-xs text-gray-500">
            Último contato: {new Date(contact.lastContact).toLocaleDateString('pt-BR')}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {contact.tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className={cn(
                "text-xs px-2 py-1",
                isDarkMode ? "bg-[#3f3f46] text-[#a1a1aa]" : "bg-gray-100 text-gray-700"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex h-full flex-col", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      {/* Header redesenhado */}
      <div className="px-8 py-8 border-b border-[#b5103c]/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className={cn(
              "inline-flex p-4 rounded-full mb-4",
              isDarkMode ? "bg-[#18181b]" : "bg-white"
            )}>
              <Users size={32} className="text-[#b5103c]" strokeWidth={1.5} />
            </div>
            <h1 className={cn(
              "text-3xl font-bold mb-2",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Gerenciar Contatos
            </h1>
            <p className={cn(
              "text-lg mb-6",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
            )}>
              Organize e gerencie todos os seus contatos
            </p>
            
            <Button className="gap-2 bg-[#b5103c] hover:bg-[#8a0c2e] text-white px-6 py-3 rounded-lg font-medium">
              <UserPlus className="h-5 w-5" strokeWidth={1.5} />
              Novo Contato
            </Button>
          </div>

          {/* Stats redesenhadas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <Users className="h-6 w-6 text-[#b5103c] mx-auto mb-2" strokeWidth={1.5} />
              <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                {contacts.length}
              </p>
              <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Total
              </p>
            </div>
            
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <Star className="h-6 w-6 text-[#b5103c] mx-auto mb-2" strokeWidth={1.5} />
              <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                {contacts.filter(c => c.isFavorite).length}
              </p>
              <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Favoritos
              </p>
            </div>
            
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <div className="h-6 w-6 rounded-full bg-[#b5103c] mx-auto mb-2"></div>
              <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                {contacts.filter(c => c.status === 'active').length}
              </p>
              <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Ativos
              </p>
            </div>
            
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
            )}>
              <MessageCircle className="h-6 w-6 text-[#b5103c] mx-auto mb-2" strokeWidth={1.5} />
              <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                {contacts.filter(c => c.conversationCount > 0).length}
              </p>
              <p className={cn("text-sm", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                Com Conversas
              </p>
            </div>
          </div>

          {/* Filtros redesenhados */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#b5103c]" strokeWidth={1.5} />
                <Input
                  placeholder="Buscar por nome, telefone, email ou tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "pl-12 py-3 rounded-lg border-2 focus:border-[#b5103c] focus:ring-2 focus:ring-[#b5103c]/20",
                    isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
                  )}
                />
              </div>
            </div>
            
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={cn(
                "px-4 py-3 rounded-lg border-2 text-sm font-medium focus:border-[#b5103c] focus:ring-2 focus:ring-[#b5103c]/20",
                isDarkMode 
                  ? "bg-[#18181b] border-[#3f3f46] text-white" 
                  : "bg-white border-gray-200"
              )}
            >
              <option value="all">Todas as Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Contatos Favoritos */}
              {favoriteContacts.length > 0 && (
                <div>
                  <h2 className={cn(
                    "text-xl font-bold mb-6 flex items-center gap-3",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    <Star className="h-6 w-6 text-[#b5103c]" strokeWidth={1.5} />
                    Contatos Favoritos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteContacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                </div>
              )}

              {/* Outros Contatos */}
              {regularContacts.length > 0 && (
                <div>
                  <h2 className={cn(
                    "text-xl font-bold mb-6 flex items-center gap-3",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    <Users className="h-6 w-6 text-[#b5103c]" strokeWidth={1.5} />
                    {favoriteContacts.length > 0 ? 'Outros Contatos' : 'Todos os Contatos'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularContacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                </div>
              )}

              {/* Estado vazio */}
              {filteredContacts.length === 0 && (
                <div className="text-center py-16">
                  <Users size={64} className={cn(
                    "mx-auto mb-6",
                    isDarkMode ? "text-[#3f3f46]" : "text-gray-300"
                  )} strokeWidth={1.5} />
                  <p className={cn(
                    "text-xl font-semibold mb-2",
                    isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                  )}>
                    {searchTerm || selectedTag !== 'all' ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                  </p>
                  <p className={cn(
                    "text-lg mb-6",
                    isDarkMode ? "text-[#71717a]" : "text-gray-500"
                  )}>
                    {searchTerm || selectedTag !== 'all' ? 'Tente ajustar os filtros' : 'Adicione novos contatos para começar'}
                  </p>
                  {!searchTerm && selectedTag === 'all' && (
                    <Button className="gap-2 bg-[#b5103c] hover:bg-[#8a0c2e] text-white px-6 py-3 rounded-lg font-medium">
                      <UserPlus className="h-5 w-5" strokeWidth={1.5} />
                      Adicionar Primeiro Contato
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
