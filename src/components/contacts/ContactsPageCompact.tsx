
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChannels } from '@/contexts/ChannelContext';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  User,
  Hash,
  MessageCircle,
  Filter,
  UserPlus
} from 'lucide-react';

interface ContactsPageCompactProps {
  isDarkMode: boolean;
}

// Mock data para demonstração com indicativo de canal
const mockContacts = [
  {
    id: '1',
    name: 'Maria Silva',
    phone: '(75) 99123-4567',
    email: 'maria.silva@email.com',
    city: 'Canarana',
    channels: ['canarana', 'chat'],
    lastChannel: 'canarana',
    lastContact: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'João Santos',
    phone: '(75) 98765-4321',
    email: 'joao.santos@email.com',
    city: 'João Dourado',
    channels: ['joao-dourado'],
    lastChannel: 'joao-dourado',
    lastContact: '2024-01-14',
    status: 'active'
  },
  {
    id: '3',
    name: 'Ana Costa',
    phone: '(75) 91234-5678',
    email: 'ana.costa@email.com',
    city: 'Souto Soares',
    channels: ['souto-soares', 'gerente-lojas'],
    lastChannel: 'souto-soares',
    lastContact: '2024-01-13',
    status: 'pending'
  },
  {
    id: '4',
    name: 'Carlos Oliveira',
    phone: '(75) 92345-6789',
    email: 'carlos.oliveira@email.com',
    city: 'América Dourada',
    channels: ['america-dourada', 'chat'],
    lastChannel: 'america-dourada',
    lastContact: '2024-01-12',
    status: 'active'
  }
];

export const ContactsPageCompact: React.FC<ContactsPageCompactProps> = ({ isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const { channels } = useChannels();

  // Mapear nomes de canais
  const getChannelDisplayName = (channelId: string) => {
    const nameMap: Record<string, string> = {
      'chat': 'Villa Glamour',
      'canarana': 'Canarana',
      'souto-soares': 'Souto Soares',
      'joao-dourado': 'João Dourado',
      'america-dourada': 'América Dourada',
      'gerente-lojas': 'Gerente Lojas',
      'gerente-externo': 'Andressa'
    };
    return nameMap[channelId] || channelId;
  };

  // Obter cor do canal
  const getChannelColor = (channelId: string) => {
    const colorMap: Record<string, string> = {
      'chat': 'bg-blue-500',
      'canarana': 'bg-green-500',
      'souto-soares': 'bg-purple-500',
      'joao-dourado': 'bg-yellow-500',
      'america-dourada': 'bg-red-500',
      'gerente-lojas': 'bg-indigo-500',
      'gerente-externo': 'bg-pink-500'
    };
    return colorMap[channelId] || 'bg-gray-500';
  };

  // Filtrar contatos
  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChannel = filterChannel === 'all' || contact.channels.includes(filterChannel);
    
    return matchesSearch && matchesChannel;
  });

  const ContactCard = ({ contact }: { contact: any }) => {
    return (
      <Card className={cn(
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2",
        isDarkMode 
          ? "bg-[#18181b] border-[#3f3f46] hover:border-[#b5103c]/50" 
          : "bg-white border-gray-200 hover:border-[#b5103c]/50"
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isDarkMode ? "bg-[#27272a]" : "bg-gray-100"
              )}>
                <User size={20} className="text-[#b5103c]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className={cn(
                  "font-semibold text-lg",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {contact.name}
                </h3>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
                )}>
                  {contact.city}
                </p>
              </div>
            </div>
            
            <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
              {contact.status === 'active' ? 'Ativo' : 'Pendente'}
            </Badge>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2">
              <Phone size={16} className="text-[#b5103c]" strokeWidth={1.5} />
              <span className={cn(
                "text-sm",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
              )}>
                {contact.phone}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Mail size={16} className="text-[#b5103c]" strokeWidth={1.5} />
              <span className={cn(
                "text-sm",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
              )}>
                {contact.email}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-[#b5103c]" strokeWidth={1.5} />
              <span className={cn(
                "text-sm",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
              )}>
                Último contato: {contact.lastContact}
              </span>
            </div>
          </div>

          {/* Indicadores de Canal */}
          <div className="border-t pt-4">
            <p className={cn(
              "text-xs font-medium mb-2",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
            )}>
              Canais:
            </p>
            <div className="flex flex-wrap gap-2">
              {contact.channels.map((channelId: string, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white",
                    getChannelColor(channelId)
                  )}
                >
                  <Hash size={12} strokeWidth={1.5} />
                  <span>{getChannelDisplayName(channelId)}</span>
                  {channelId === contact.lastChannel && (
                    <div className="w-2 h-2 bg-white rounded-full ml-1" />
                  )}
                </div>
              ))}
            </div>
            {contact.lastChannel && (
              <p className={cn(
                "text-xs mt-2",
                isDarkMode ? "text-[#71717a]" : "text-gray-500"
              )}>
                Último canal: <span className="font-medium">{getChannelDisplayName(contact.lastChannel)}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn(
      "h-full overflow-auto",
      isDarkMode ? "bg-[#09090b]" : "bg-gray-50"
    )}>
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header redesenhado */}
        <div className="text-center mb-12">
          <div className={cn(
            "inline-flex p-6 rounded-full mb-6",
            isDarkMode ? "bg-[#18181b]" : "bg-white"
          )}>
            <Users size={48} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <h1 className={cn(
            "text-4xl font-bold mb-4",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Contatos
          </h1>
          <p className={cn(
            "text-xl",
            isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
          )}>
            Gerencie todos os seus contatos
          </p>
        </div>

        {/* Filtros e busca */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={20} className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-400"
            )} strokeWidth={1.5} />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10",
                isDarkMode 
                  ? "bg-[#18181b] border-[#3f3f46] text-white placeholder:text-[#a1a1aa]" 
                  : "bg-white border-gray-300"
              )}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 font-medium",
                isDarkMode 
                  ? "bg-[#18181b] border-[#3f3f46] text-white" 
                  : "bg-white border-gray-300"
              )}
            >
              <option value="all">Todos os canais</option>
              <option value="chat">Villa Glamour</option>
              <option value="canarana">Canarana</option>
              <option value="souto-soares">Souto Soares</option>
              <option value="joao-dourado">João Dourado</option>
              <option value="america-dourada">América Dourada</option>
              <option value="gerente-lojas">Gerente Lojas</option>
              <option value="gerente-externo">Andressa</option>
            </select>
            
            <Button className="bg-[#b5103c] hover:bg-[#a00f36] text-white">
              <UserPlus size={16} className="mr-2" strokeWidth={1.5} />
              Novo Contato
            </Button>
          </div>
        </div>

        {/* Grid de contatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-20">
            <div className={cn(
              "inline-flex p-6 rounded-full mb-6",
              isDarkMode ? "bg-[#18181b]" : "bg-white"
            )}>
              <Users size={48} className={cn(
                isDarkMode ? "text-[#3f3f46]" : "text-gray-300"
              )} strokeWidth={1.5} />
            </div>
            <h3 className={cn(
              "text-2xl font-bold mb-2",
              isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
            )}>
              Nenhum contato encontrado
            </h3>
            <p className={cn(
              "text-lg",
              isDarkMode ? "text-[#71717a]" : "text-gray-400"
            )}>
              Tente ajustar os filtros ou adicione um novo contato
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
