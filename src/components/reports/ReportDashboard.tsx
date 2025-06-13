import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, BarChart2, PieChart, LineChart, Users, MessageSquare } from 'lucide-react';
import { useReportStats } from '../../hooks/useReportStats';
import { LegacyReportGenerator } from './LegacyReportGenerator';
import { ConversationReportGenerator } from './ConversationReportGenerator';

interface ReportDashboardProps {
  isDarkMode: boolean;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportType, setReportType] = useState('performance');
  const [channelId, setChannelId] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  
  const { 
    performanceStats, 
    conversationStats, 
    channelStats, 
    userStats,
    conversations,
    channels,
    loading 
  } = useReportStats(dateRange.from, dateRange.to);

  const getReportData = () => {
    switch (reportType) {
      case 'performance':
        return performanceStats;
      case 'conversations':
        return conversationStats;
      case 'channels':
        return channelStats;
      case 'users':
        return userStats;
      default:
        return [];
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'performance':
        return 'Relatório de Performance';
      case 'conversations':
        return 'Relatório de Conversas';
      case 'channels':
        return 'Relatório de Canais';
      case 'users':
        return 'Relatório de Usuários';
      default:
        return 'Relatório';
    }
  };

  const selectedConversation = conversations.find(conv => conv.session_id === channelId);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Central de Relatórios</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecionar período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: range.from,
                      to: range.to
                    });
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Conversas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : conversationStats.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No período selecionado
                </p>
              </CardContent>
            </Card>
            
            <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Canais Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : channels.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Com atividade no período
                </p>
              </CardContent>
            </Card>
            
            <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio de Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : '3.2 min'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média global
                </p>
              </CardContent>
            </Card>
            
            <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Resolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : '87%'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversas resolvidas
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className="text-lg">Gerar Relatório</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Tipo de Relatório
                    </label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de relatório" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="conversations">Conversas</SelectItem>
                        <SelectItem value="channels">Canais</SelectItem>
                        <SelectItem value="users">Usuários</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <LegacyReportGenerator
                    reportType={reportType}
                    reportTitle={getReportTitle()}
                    reportData={getReportData()}
                    period={{
                      start: dateRange.from.toISOString(),
                      end: dateRange.to.toISOString()
                    }}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className="text-lg">Relatório de Conversa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Selecione uma Conversa
                    </label>
                    <Select value={channelId} onValueChange={setChannelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conversa" />
                      </SelectTrigger>
                      <SelectContent>
                        {conversations.slice(0, 10).map((conv) => (
                          <SelectItem key={conv.session_id} value={conv.session_id}>
                            {conv.contact_name || conv.session_id} ({conv.channel_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {channelId && selectedConversation && (
                    <ConversationReportGenerator
                      channelId={selectedConversation.channel_id}
                      channelName={selectedConversation.channel_name}
                      sessionId={selectedConversation.session_id}
                      contactName={selectedConversation.contact_name || selectedConversation.session_id}
                      period={{
                        start: dateRange.from.toISOString(),
                        end: dateRange.to.toISOString()
                      }}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle>Relatório de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <LegacyReportGenerator
                reportType="performance"
                reportTitle="Relatório de Performance"
                reportData={performanceStats}
                period={{
                  start: dateRange.from.toISOString(),
                  end: dateRange.to.toISOString()
                }}
                isDarkMode={isDarkMode}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="channels">
          <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle>Relatório de Canais</CardTitle>
            </CardHeader>
            <CardContent>
              <LegacyReportGenerator
                reportType="channels"
                reportTitle="Relatório de Canais"
                reportData={channelStats}
                period={{
                  start: dateRange.from.toISOString(),
                  end: dateRange.to.toISOString()
                }}
                isDarkMode={isDarkMode}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversations">
          <Card className={isDarkMode ? 'bg-card border-border' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle>Relatório de Conversas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Selecione uma Conversa
                  </label>
                  <Select value={channelId} onValueChange={setChannelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conversa" />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations.slice(0, 10).map((conv) => (
                        <SelectItem key={conv.session_id} value={conv.session_id}>
                          {conv.contact_name || conv.session_id} ({conv.channel_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {channelId && selectedConversation && (
                  <ConversationReportGenerator
                    channelId={selectedConversation.channel_id}
                    channelName={selectedConversation.channel_name}
                    sessionId={selectedConversation.session_id}
                    contactName={selectedConversation.contact_name || selectedConversation.session_id}
                    period={{
                      start: dateRange.from.toISOString(),
                      end: dateRange.to.toISOString()
                    }}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
