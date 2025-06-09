
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, MessageSquare, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChannels } from '@/contexts/ChannelContext';
import { useEnhancedReports } from '@/hooks/useEnhancedReports';

interface ConversationReportProps {
  isDarkMode: boolean;
}

interface Conversation {
  id: string;
  contact_name: string;
  created_at: string;
  status: 'open' | 'resolved' | 'pending';
  messages: any[];
  session_id: string;
  channel_id?: string;
  message_count: number;
  last_message_time: string;
}

export const ConversationReport: React.FC<ConversationReportProps> = ({ isDarkMode }) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { channels } = useChannels();
  const { toast } = useToast();
  const { generateConversationReport } = useEnhancedReports();

  // Mock data for demonstration
  useEffect(() => {
    if (selectedChannel && startDate && endDate) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockConversations: Conversation[] = [
          {
            id: '1',
            contact_name: 'João Silva',
            created_at: new Date().toISOString(),
            status: 'resolved',
            messages: [],
            session_id: '123456789',
            channel_id: selectedChannel,
            message_count: 5,
            last_message_time: new Date().toISOString()
          },
          {
            id: '2',
            contact_name: 'Maria Santos',
            created_at: new Date().toISOString(),
            status: 'open',
            messages: [],
            session_id: '987654321',
            channel_id: selectedChannel,
            message_count: 3,
            last_message_time: new Date().toISOString()
          }
        ];
        setConversations(mockConversations);
        setIsLoading(false);
      }, 1000);
    }
  }, [selectedChannel, startDate, endDate]);

  const handleGenerateReport = async () => {
    if (!selectedChannel || !startDate || !endDate) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um canal e defina o período",
        variant: "destructive"
      });
      return;
    }
    
    if (conversations.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há conversas no período selecionado",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const selectedChannelData = channels.find(c => c.id === selectedChannel);
      const channelName = selectedChannelData?.name || 'Canal';
      
      // Convert conversations to string format for the report
      const conversationsText = conversations.map(conv => 
        `Conversa ${conv.id}: ${conv.contact_name} - ${conv.message_count} mensagens - Status: ${conv.status}`
      ).join('\n');
      
      const result = await generateConversationReport(
        channelName,
        conversationsText,
        {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      );
      
      toast({
        title: "Relatório gerado!",
        description: `Relatório de conversas do canal ${channelName} gerado com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      resolved: 'default',
      pending: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'open' ? 'Aberta' : status === 'resolved' ? 'Resolvida' : 'Pendente'}
      </Badge>
    );
  };

  return (
    <div className={cn("space-y-6", isDarkMode ? "text-white" : "text-gray-900")}>
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-[#b5103c]" />
        <h2 className="text-2xl font-bold">Relatório de Conversas</h2>
      </div>

      {/* Filtros */}
      <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Canal</label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className={cn(isDarkMode ? "bg-[#09090b] border-[#3f3f46]" : "bg-white border-gray-200")}>
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Data Inicial</label>
              <DatePicker
                date={startDate}
                setDate={setStartDate}
                placeholder="Selecione a data inicial"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Data Final</label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                placeholder="Selecione a data final"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedChannel || !startDate || !endDate || isGenerating}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Conversas */}
      {selectedChannel && startDate && endDate && (
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conversas do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]" />
              </div>
            ) : conversations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Mensagens</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow key={conversation.id}>
                      <TableCell className="font-mono text-xs">
                        {conversation.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {conversation.contact_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {new Date(conversation.created_at).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>{conversation.message_count}</TableCell>
                      <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma conversa encontrada no período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
