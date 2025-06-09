
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { cn } from '@/lib/utils';
import { History, Search, Activity, User, Calendar, LogIn, LogOut, Settings, MessageSquare, Shield, Eye, RefreshCw } from 'lucide-react';

interface AuditHistoryCompactProps {
  isDarkMode: boolean;
}

export const AuditHistoryCompact: React.FC<AuditHistoryCompactProps> = ({ isDarkMode }) => {
  const { logs, loading, loadLogs } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return LogIn;
    if (action.includes('logout')) return LogOut;
    if (action.includes('message')) return MessageSquare;
    if (action.includes('settings') || action.includes('config')) return Settings;
    if (action.includes('dashboard') || action.includes('accessed')) return Eye;
    if (action.includes('user') || action.includes('admin')) return Shield;
    return Activity;
  };

  const getActionCategory = (action: string) => {
    if (action.includes('login') || action.includes('logout')) return 'Autenticação';
    if (action.includes('message') || action.includes('chat')) return 'Mensagens';
    if (action.includes('user') || action.includes('admin')) return 'Usuários';
    if (action.includes('channel')) return 'Canais';
    if (action.includes('settings') || action.includes('config')) return 'Configurações';
    if (action.includes('dashboard') || action.includes('accessed')) return 'Navegação';
    return 'Outros';
  };

  const translateAction = (action: string) => {
    const translations: Record<string, string> = {
      'login': 'fez login no sistema',
      'logout': 'fez logout do sistema',
      'dashboard_accessed': 'acessou o painel principal',
      'chat_interface_accessed': 'acessou a interface de chat',
      'settings_accessed': 'acessou as configurações',
    };

    if (translations[action]) return translations[action];
    
    if (action.includes('login')) return 'fez login no sistema';
    if (action.includes('logout')) return 'fez logout do sistema';
    if (action.includes('dashboard')) return 'acessou o painel de controle';
    if (action.includes('chat')) return 'acessou a interface de chat';
    if (action.includes('settings')) return 'alterou configurações do sistema';
    if (action.includes('accessed')) return 'acessou uma seção do sistema';
    
    return action.replace(/_/g, ' ').toLowerCase();
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const logDate = new Date(log.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    users: new Set(logs.map(log => log.user_name)).size,
    categories: new Set(logs.map(log => getActionCategory(log.action))).size
  };

  const recentLogs = filteredLogs.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
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
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-sm text-muted-foreground">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.categories}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => loadLogs()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Lista de Atividades Recentes */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : recentLogs.length > 0 ? (
            <div className="space-y-2 p-4 max-h-96 overflow-y-auto">
              {recentLogs.map((log, index) => {
                const ActionIcon = getActionIcon(log.action);
                const timestamp = new Date(log.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <ActionIcon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <span className="font-semibold">{log.user_name || 'Sistema'}</span>{' '}
                        {translateAction(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timestamp} • {getActionCategory(log.action)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum registro encontrado.' : 'Nenhum registro de auditoria encontrado.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
