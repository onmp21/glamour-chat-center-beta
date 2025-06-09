
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChannels } from '@/contexts/ChannelContext';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { cn } from '@/lib/utils';
import { MessageSquare, Loader2, Plus, Search, Filter, Settings, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChannelManagementSectionProps {
  isDarkMode: boolean;
}

export const ChannelManagementSection: React.FC<ChannelManagementSectionProps> = ({ isDarkMode }) => {
  const { channels, loading, updateChannelStatus } = useChannels();
  const { profiles, getProfileByUserId } = useUserProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'store' | 'manager' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddChannel, setShowAddChannel] = useState(false);

  const getTypeLabel = (type: 'general' | 'store' | 'manager' | 'admin') => {
    const labels = {
      general: 'Geral',
      store: 'Loja',
      manager: 'Gerência',
      admin: 'Administração'
    };
    return labels[type];
  };

  const getTypeBadgeColor = (type: 'general' | 'store' | 'manager' | 'admin') => {
    const colors = {
      general: 'bg-[#b5103c] text-white',
      store: 'bg-green-500 text-white',
      manager: 'bg-purple-500 text-white',
      admin: 'bg-red-500 text-white'
    };
    return colors[type];
  };

  const handleToggleChannel = async (channelId: string, isActive: boolean) => {
    try {
      await updateChannelStatus(channelId, isActive);
      toast({
        title: 'Sucesso',
        description: `Canal ${isActive ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Erro ao ${isActive ? 'ativar' : 'desativar'} o canal.`,
        variant: 'destructive'
      });
    }
  };

  // Filtrar canais baseado na busca e filtros
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || channel.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && channel.isActive) || 
                         (statusFilter === 'inactive' && !channel.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Estatísticas dos canais
  const totalChannels = channels.length;
  const activeChannels = channels.filter(c => c.isActive).length;
  const inactiveChannels = channels.filter(c => !c.isActive).length;
  const storeChannels = channels.filter(c => c.type === 'store').length;

  // Função para obter perfil do usuário responsável pelo canal
  const getChannelResponsible = (channelName: string) => {
    // Mapear canais para usuários responsáveis baseado no nome
    const channelMapping: Record<string, string> = {
      'Yelena-AI': 'Sistema',
      'Canarana': 'Vendedora Canarana',
      'Souto Soares': 'Vendedora Souto Soares',
      'João Dourado': 'Vendedora João Dourado',
      'América Dourada': 'Vendedora América Dourada',
      'Gerente das Lojas': 'Gerente de Loja',
      'Gerente do Externo': 'Andressa'
    };
    return channelMapping[channelName] || 'Sistema';
  };

  const getChannelAvatar = (channelName: string) => {
    const responsible = getChannelResponsible(channelName);
    // Find profile by name - since we don't have user IDs mapped to channels yet
    const profilesArray = Object.values(profiles);
    const profile = profilesArray.find(p => p && responsible.toLowerCase().includes(responsible.split(' ')[0].toLowerCase()));
    return profile;
  };

  if (loading) {
    return (
      <Card className={cn(
        "border shadow-lg",
        isDarkMode ? "bg-background border-border" : "bg-white border-gray-200"
      )}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#b5103c]" />
          <span className={cn("ml-2", isDarkMode ? "text-foreground" : "text-gray-900")}>
            Carregando canais...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border shadow-lg",
      isDarkMode ? "bg-background border-border" : "bg-white border-gray-200"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "flex items-center justify-between",
          isDarkMode ? "text-foreground" : "text-gray-900"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#b5103c]/10">
              <MessageSquare className="h-5 w-5 text-[#b5103c]" />
            </div>
            Gerenciar Canais
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowAddChannel(!showAddChannel)}
            className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
          >
            <Plus size={16} className="mr-2" />
            Novo Canal
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulário de adição de canal */}
        {showAddChannel && (
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-background border-border" : "bg-gray-50 border-gray-200"
          )}>
            <h3 className={cn(
              "text-lg font-semibold mb-3",
              isDarkMode ? "text-foreground" : "text-gray-900"
            )}>
              Adicionar Novo Canal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  isDarkMode ? "text-muted-foreground" : "text-gray-700"
                )}>
                  Nome do Canal
                </label>
                <Input 
                  placeholder="Ex: Canal WhatsApp Loja Centro" 
                  className={cn(
                    isDarkMode ? "bg-background border-border" : "bg-white border-gray-300"
                  )}
                />
              </div>
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  isDarkMode ? "text-muted-foreground" : "text-gray-700"
                )}>
                  Tipo de Canal
                </label>
                <select className={cn(
                  "w-full px-3 py-2 rounded-md border",
                  isDarkMode ? "bg-background border-border text-foreground" : "bg-white border-gray-300"
                )}>
                  <option value="general">Geral</option>
                  <option value="store">Loja</option>
                  <option value="manager">Gerência</option>
                  <option value="admin">Administração</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddChannel(false)}
                className={cn(
                  isDarkMode ? "border-border text-muted-foreground" : "border-gray-300"
                )}
              >
                Cancelar
              </Button>
              <Button className="bg-[#b5103c] hover:bg-[#9d0e34] text-white">
                Adicionar Canal
              </Button>
            </div>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2",
              isDarkMode ? "text-muted-foreground" : "text-gray-500"
            )} />
            <Input
              placeholder="Buscar canal por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10",
                isDarkMode ? "bg-background border-border" : "bg-white border-gray-300"
              )}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={18} className={cn(
              isDarkMode ? "text-muted-foreground" : "text-gray-500"
            )} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className={cn(
                "px-3 py-2 rounded-md border",
                isDarkMode ? "bg-background border-border text-foreground" : "bg-white border-gray-300"
              )}
            >
              <option value="all">Todos os tipos</option>
              <option value="general">Geral</option>
              <option value="store">Loja</option>
              <option value="manager">Gerência</option>
              <option value="admin">Administração</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={cn(
                "px-3 py-2 rounded-md border",
                isDarkMode ? "bg-background border-border text-foreground" : "bg-white border-gray-300"
              )}
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-background border-border" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center space-x-2">
              <MessageSquare size={20} className="text-[#b5103c]" />
              <div>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-muted-foreground" : "text-gray-600"
                )}>Total de Canais</p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-foreground" : "text-gray-900"
                )}>{totalChannels}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-background border-border" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} className="text-green-500" />
              <div>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-muted-foreground" : "text-gray-600"
                )}>Canais Ativos</p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-foreground" : "text-gray-900"
                )}>{activeChannels}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-background border-border" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center space-x-2">
              <XCircle size={20} className="text-red-500" />
              <div>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-muted-foreground" : "text-gray-600"
                )}>Canais Inativos</p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-foreground" : "text-gray-900"
                )}>{inactiveChannels}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode ? "bg-background border-border" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center space-x-2">
              <MessageSquare size={20} className="text-[#b5103c]" />
              <div>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-muted-foreground" : "text-gray-600"
                )}>Canais de Loja</p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-foreground" : "text-gray-900"
                )}>{storeChannels}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Canais */}
        <div className="space-y-3">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare size={48} className={cn(
                "mx-auto mb-4",
                isDarkMode ? "text-muted-foreground" : "text-gray-400"
              )} />
              <p className={cn(
                "text-lg",
                isDarkMode ? "text-muted-foreground" : "text-gray-600"
              )}>
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 
                  'Nenhum canal encontrado com os filtros aplicados.' : 
                  'Nenhum canal encontrado.'}
              </p>
              {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchTerm(''); setTypeFilter('all'); setStatusFilter('all'); }}
                  className="mt-4"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            filteredChannels.map(channel => {
              const channelProfile = getChannelAvatar(channel.name);
              const responsible = getChannelResponsible(channel.name);
              
              return (
                <div 
                  key={channel.id} 
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                    isDarkMode ? 
                      "bg-background border-border hover:bg-accent/50" : 
                      "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={channelProfile?.avatar_url || undefined} alt={responsible} />
                      <AvatarFallback className="bg-[#b5103c] text-white text-sm font-semibold">
                        {responsible.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={cn(
                          "font-medium text-lg",
                          isDarkMode ? "text-foreground" : "text-gray-900"
                        )}>
                          {channel.name}
                        </h4>
                        {channel.isDefault && (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            isDarkMode ? "border-border text-muted-foreground" : "border-gray-400 text-gray-600"
                          )}>
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge className={getTypeBadgeColor(channel.type)}>
                          {getTypeLabel(channel.type)}
                        </Badge>
                        <Badge className={channel.isActive ? 
                          "bg-green-100 text-green-800" : 
                          "bg-red-100 text-red-800"
                        }>
                          {channel.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className={cn(
                          "text-xs",
                          isDarkMode ? "text-muted-foreground" : "text-gray-500"
                        )}>
                          Responsável: {responsible}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        "flex items-center space-x-1",
                        isDarkMode ? "border-border text-muted-foreground" : "border-gray-300"
                      )}
                    >
                      <Settings size={16} />
                      <span>Configurar</span>
                    </Button>
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-muted-foreground" : "text-gray-700"
                      )}>
                        {channel.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={(checked) => handleToggleChannel(channel.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
