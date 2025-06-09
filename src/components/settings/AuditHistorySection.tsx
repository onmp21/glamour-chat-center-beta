import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { cn } from '@/lib/utils';
import { History, Search, Filter, Download, Eye, User, Calendar, Activity, MessageSquare, Settings, LogIn, LogOut, Shield } from 'lucide-react';

interface AuditHistorySectionProps {
  isDarkMode: boolean;
}

export const AuditHistorySection: React.FC<AuditHistorySectionProps> = ({ isDarkMode }) => {
  const { logs, loading, loadLogs } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.action.includes(filterType);
    const matchesDate = !startDate || !endDate || 
                       (new Date(log.created_at) >= new Date(startDate) && 
                        new Date(log.created_at) <= new Date(endDate));
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('login')) {
      return <LogIn size={16} className="text-green-600" />;
    }
    if (action.includes('logout')) {
      return <LogOut size={16} className="text-red-600" />;
    }
    if (action.includes('message')) {
      return <MessageSquare size={16} className="text-blue-600" />;
    }
    if (action.includes('settings') || action.includes('config')) {
      return <Settings size={16} className="text-purple-600" />;
    }
    if (action.includes('dashboard') || action.includes('accessed')) {
      return <Eye size={16} className="text-indigo-600" />;
    }
    if (action.includes('channel')) {
      return <MessageSquare size={16} className="text-orange-600" />;
    }
    if (action.includes('user') || action.includes('admin')) {
      return <Shield size={16} className="text-red-600" />;
    }
    return <Activity size={16} className="text-gray-600" />;
  };

  const translateAction = (action: string, details?: any) => {
    // Traduções específicas para ações comuns
    const translations: Record<string, string> = {
      'login': 'fez login no sistema',
      'logout': 'fez logout do sistema',
      'dashboard_accessed': 'acessou o painel principal',
      'chat_interface_accessed': 'acessou a interface de chat',
      'channel_or_initial_id_changed': 'alterou configurações de canal',
      'settings_accessed': 'acessou as configurações',
      'user_created': 'criou um novo usuário',
      'user_updated': 'atualizou dados de usuário',
      'user_deleted': 'excluiu um usuário',
      'channel_created': 'criou um novo canal',
      'channel_updated': 'atualizou configurações de canal',
      'channel_deleted': 'excluiu um canal',
      'message_sent': 'enviou uma mensagem',
      'message_received': 'recebeu uma mensagem',
      'conversation_resolved': 'resolveu uma conversa',
      'notification_settings_changed': 'alterou configurações de notificação',
      'profile_updated': 'atualizou o perfil',
      'password_changed': 'alterou a senha',
      'backup_created': 'criou um backup',
      'report_generated': 'gerou um relatório'
    };

    // Verificar se existe uma tradução direta
    if (translations[action]) {
      return translations[action];
    }

    // Traduções baseadas em palavras-chave
    if (action.includes('login')) {
      return 'fez login no sistema';
    }
    if (action.includes('logout')) {
      return 'fez logout do sistema';
    }
    if (action.includes('dashboard')) {
      return 'acessou o painel de controle';
    }
    if (action.includes('chat')) {
      return 'acessou a interface de chat';
    }
    if (action.includes('channel')) {
      return 'interagiu com configurações de canal';
    }
    if (action.includes('message')) {
      return 'realizou ação relacionada a mensagens';
    }
    if (action.includes('user')) {
      return 'realizou ação relacionada a usuários';
    }
    if (action.includes('settings') || action.includes('config')) {
      return 'alterou configurações do sistema';
    }
    if (action.includes('accessed')) {
      return 'acessou uma seção do sistema';
    }
    if (action.includes('created')) {
      return 'criou um novo item';
    }
    if (action.includes('updated')) {
      return 'atualizou informações';
    }
    if (action.includes('deleted')) {
      return 'excluiu um item';
    }

    // Fallback: retornar a ação original com formatação melhorada
    return action.replace(/_/g, ' ').toLowerCase();
  };

  const getActionDescription = (log: any) => {
    const timestamp = new Date(log.created_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const user = log.user_name || 'Sistema';
    const translatedAction = translateAction(log.action, log.details);
    
    return `${user} ${translatedAction} em ${timestamp}`;
  };

  const getActionCategory = (action: string) => {
    if (action.includes('login') || action.includes('logout')) {
      return 'Autenticação';
    }
    if (action.includes('message') || action.includes('chat')) {
      return 'Mensagens';
    }
    if (action.includes('user') || action.includes('admin')) {
      return 'Gerenciamento de Usuários';
    }
    if (action.includes('channel')) {
      return 'Gerenciamento de Canais';
    }
    if (action.includes('settings') || action.includes('config')) {
      return 'Configurações';
    }
    if (action.includes('dashboard') || action.includes('accessed')) {
      return 'Navegação';
    }
    return 'Outros';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Autenticação': 'bg-green-100 text-green-800',
      'Mensagens': 'bg-blue-100 text-blue-800',
      'Gerenciamento de Usuários': 'bg-red-100 text-red-800',
      'Gerenciamento de Canais': 'bg-orange-100 text-orange-800',
      'Configurações': 'bg-purple-100 text-purple-800',
      'Navegação': 'bg-indigo-100 text-indigo-800',
      'Outros': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Outros'];
  };

  const getUniqueCategories = () => {
    const categories = logs.map(log => getActionCategory(log.action));
    return [...new Set(categories)];
  };

  return (
    <div className={cn(
      "p-6",
      isDarkMode ? "bg-background" : "bg-gray-50"
    )}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={cn(
            "border",
            isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {logs.length}
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Total de Ações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "border",
            isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <User size={20} className="text-green-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {new Set(logs.map(log => log.user_name)).size}
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Usuários Ativos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "border",
            isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {logs.filter(log => {
                      const logDate = new Date(log.created_at);
                      const today = new Date();
                      return logDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Ações Hoje
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border",
            isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <MessageSquare size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {getUniqueCategories().length}
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                    Categorias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className={cn(
          "border",
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              "flex items-center gap-3",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              <Filter size={20} className="text-[#b5103c]" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por ação ou usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="login">Autenticação</SelectItem>
                    <SelectItem value="message">Mensagens</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                    <SelectItem value="channel">Canais</SelectItem>
                    <SelectItem value="settings">Configurações</SelectItem>
                    <SelectItem value="dashboard">Navegação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                Exportar Logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadLogs()}>
                <Activity size={16} className="mr-2" />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Logs */}
        <Card className={cn(
          "border",
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              "flex items-center gap-3",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              <History size={20} className="text-[#b5103c]" />
              Histórico de Atividades ({filteredLogs.length} registros)
            </CardTitle>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Registro detalhado e traduzido de todas as ações realizadas no sistema pelos usuários
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className={cn("mt-2 text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                  Carregando histórico...
                </p>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLogs.map((log, index) => {
                  const category = getActionCategory(log.action);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                        isDarkMode ? "border-border bg-background/50 hover:bg-background/80" : "border-gray-200 bg-gray-50 hover:bg-white"
                      )}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getCategoryColor(category)
                          )}>
                            {category}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-card-foreground" : "text-gray-900"
                        )}>
                          {getActionDescription(log)}
                        </p>
                        {log.details && (
                          <div className={cn(
                            "text-xs mt-2 p-2 rounded bg-opacity-50",
                            isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                          )}>
                            <strong>Detalhes técnicos:</strong> {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Eye size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <History size={48} className={cn(
                  "mx-auto mb-4",
                  isDarkMode ? "text-muted-foreground" : "text-gray-400"
                )} />
                <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                  {searchTerm || filterType !== 'all' || startDate || endDate 
                    ? 'Nenhum registro encontrado com os filtros aplicados'
                    : 'Nenhum registro de auditoria encontrado'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

