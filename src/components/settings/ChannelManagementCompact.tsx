import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChannels } from '@/contexts/ChannelContext';
import { cn } from '@/lib/utils';
import { MessageSquare, Search, Settings, CheckCircle, XCircle, Hash, Users, Phone, Bot, Plus, Edit3, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreateChannelModal } from './CreateChannelModal';
import { EditChannelModal } from './EditChannelModal';
import { DeleteChannelModal } from './DeleteChannelModal';

interface ChannelManagementCompactProps {
  isDarkMode: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
}

export const ChannelManagementCompact: React.FC<ChannelManagementCompactProps> = ({
  isDarkMode
}) => {
  const {
    channels,
    loading,
    updateChannelStatus,
    refetch
  } = useChannels();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [optimisticChannels, setOptimisticChannels] = useState<typeof channels | null>(null);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Usar optimisticChannels se houver, senão channels do contexto
  const shownChannels = optimisticChannels ?? channels;
  useEffect(() => {
    // Quando channels do contexto mudar (ex: após refetch), limpa otimismo
    setOptimisticChannels(null);
  }, [channels]);
  const getChannelIcon = (channelName: string) => {
    if (channelName.includes('Yelena') || channelName.includes('AI') || channelName.includes('Óticas')) {
      return Bot;
    }
    if (channelName.includes('Canarana') || channelName.includes('Souto') || channelName.includes('João') || channelName.includes('América')) {
      return Hash;
    }
    if (channelName.includes('Gustavo') || channelName.includes('Lojas')) {
      return Users;
    }
    if (channelName.includes('Andressa') || channelName.includes('Externo')) {
      return Phone;
    }
    return MessageSquare;
  };
  const getTypeLabel = (type: 'general' | 'store' | 'manager' | 'admin') => {
    const labels = {
      general: 'Geral',
      store: 'Loja',
      manager: 'Gerência',
      admin: 'Administração'
    };
    return labels[type];
  };
  const handleToggleChannel = async (channelId: string, isActive: boolean) => {
    // Otimismo: altera estado local imediatamente
    setOptimisticChannels(prev => {
      const oldList = prev ?? channels;
      return oldList.map(c => c.id === channelId ? {
        ...c,
        isActive
      } : c);
    });
    try {
      await updateChannelStatus(channelId, isActive);
      // O estado global do contexto reflete após o refetch que já existe no hook
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
      // Se falhar, volta ao valor anterior imediatamente
      setOptimisticChannels(prev => {
        const oldList = prev ?? channels;
        return oldList.map(c => c.id === channelId ? {
          ...c,
          isActive: !isActive
        } : c);
      });
    }
  };
  const handleEditChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowEditModal(true);
  };

  const handleDeleteChannel = (channel: Channel) => {
    if (channel.isDefault) {
      toast({
        title: 'Erro',
        description: 'Não é possível excluir o canal padrão.',
        variant: 'destructive'
      });
      return;
    }
    setSelectedChannel(channel);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedChannel(null);
  };

  const filteredChannels = shownChannels.filter(channel => channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = {
    total: shownChannels.length,
    active: shownChannels.filter(c => c.isActive).length,
    inactive: shownChannels.filter(c => !c.isActive).length,
    stores: shownChannels.filter(c => c.type === 'store').length
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return (
    <>
      <div className="space-y-6">
        {/* Header com botão de criar */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Gerenciar Canais
            </h2>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Crie, edite e exclua canais de comunicação
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Canal
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Hash className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.stores}</p>
                  <p className="text-sm text-muted-foreground">Lojas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar canais..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Lista de Canais com ações */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {filteredChannels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum canal encontrado.' : 'Nenhum canal disponível.'}
                </div>
              ) : (
                filteredChannels.map(channel => {
                  const ChannelIcon = getChannelIcon(channel.name);
                  return (
                    <div key={channel.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ChannelIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{channel.name}</p>
                            {channel.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Padrão
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(channel.type)}
                            </Badge>
                            <Badge className={channel.isActive ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>
                              {channel.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Ações */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditChannel(channel)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChannel(channel)}
                            disabled={channel.isDefault}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
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
      </div>

      {/* Modals */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        isDarkMode={isDarkMode}
      />
      
      <EditChannelModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        channel={selectedChannel}
        isDarkMode={isDarkMode}
      />
      
      <DeleteChannelModal
        isOpen={showDeleteModal}
        onClose={handleCloseModals}
        channel={selectedChannel}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
