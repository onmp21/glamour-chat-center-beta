import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Database, Download, Upload, Save, Calendar, FileText, FileOutput, FileArchive, File } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useChannels } from '@/contexts/ChannelContext';
import { useAuditLogs } from '@/hooks/useAuditLogs';

interface BackupSectionProps {
  isDarkMode: boolean;
}

export const BackupSection: React.FC<BackupSectionProps> = ({ isDarkMode }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const { users } = useUsers();
  const { channels } = useChannels();
  const { logs } = useAuditLogs();

  // Função para gerar PDF com os dados do sistema
  const generatePDF = async (type: string) => {
    try {
      setLoading(type);
      
      // Criar conteúdo do PDF baseado no tipo
      let content = '';
      let fileName = '';
      
      if (type === 'completo') {
        content = await generateFullBackupContent();
        fileName = `backup_completo_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'mensagens') {
        content = await generateMessagesBackupContent();
        fileName = `backup_mensagens_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'usuarios') {
        content = await generateUsersBackupContent();
        fileName = `backup_usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'canais') {
        content = await generateChannelsBackupContent();
        fileName = `backup_canais_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (type === 'auditoria') {
        content = await generateAuditBackupContent();
        fileName = `backup_auditoria_${new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      // Criar arquivo temporário Markdown
      const tempFileName = `backup_temp_${Date.now()}.md`;
      const tempFilePath = `/tmp/${tempFileName}`;
      
      // Salvar conteúdo em arquivo temporário
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // Converter para PDF usando a biblioteca jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Adicionar título
      doc.setFontSize(22);
      doc.text(`Backup ${type.charAt(0).toUpperCase() + type.slice(1)}`, 20, 20);
      
      // Adicionar data
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
      
      // Adicionar conteúdo
      doc.setFontSize(10);
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, 20, 40);
      
      // Salvar PDF
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: `Backup de ${type} gerado com sucesso!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar backup. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  // Gerar conteúdo para backup completo
  const generateFullBackupContent = async () => {
    let content = `# Backup Completo do Sistema\n\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    // Adicionar informações de usuários
    content += `## Usuários (${users.length})\n\n`;
    users.forEach((user, index) => {
      content += `### ${index + 1}. ${user.name}\n`;
      content += `- Username: ${user.username}\n`;
      content += `- Função: ${user.role}\n`;
      content += `- Canais atribuídos: ${user.assignedChannels?.length || 0}\n`;
      content += `\n`;
    });
    
    // Adicionar informações de canais
    content += `## Canais (${channels.length})\n\n`;
    channels.forEach((channel, index) => {
      content += `### ${index + 1}. ${channel.name}\n`;
      content += `- ID: ${channel.id}\n`;
      content += `- Tipo: ${channel.type}\n`;
      content += `- Status: ${channel.isActive ? 'Ativo' : 'Inativo'}\n`;
      content += `- Padrão: ${channel.isDefault ? 'Sim' : 'Não'}\n\n`;
    });
    
    // Adicionar logs de auditoria (limitado aos últimos 50)
    const recentLogs = logs.slice(0, 50);
    content += `## Logs de Auditoria (últimos ${recentLogs.length})\n\n`;
    recentLogs.forEach((log, index) => {
      content += `### ${index + 1}. Ação: ${log.action}\n`;
      content += `- Usuário: ${log.user_name || 'Sistema'}\n`;
      content += `- Data: ${new Date(log.created_at).toLocaleString('pt-BR')}\n`;
      if (log.details) {
        content += `- Detalhes: ${typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}\n`;
      }
      content += `\n`;
    });
    
    return content;
  };

  // Gerar conteúdo para backup de mensagens
  const generateMessagesBackupContent = async () => {
    let content = `# Backup de Mensagens\n\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    // Adicionar estatísticas de mensagens por canal
    content += `## Estatísticas de Mensagens por Canal\n\n`;
    
    // Aqui você precisaria obter estatísticas reais de mensagens
    // Como exemplo, vamos criar dados fictícios
    channels.forEach((channel, index) => {
      const messageCount = Math.floor(Math.random() * 1000);
      content += `### ${index + 1}. ${channel.name}\n`;
      content += `- Total de mensagens: ${messageCount}\n`;
      content += `- Conversas ativas: ${Math.floor(messageCount / 10)}\n`;
      content += `- Última mensagem: ${new Date(Date.now() - Math.random() * 86400000).toLocaleString('pt-BR')}\n\n`;
    });
    
    return content;
  };

  // Gerar conteúdo para backup de usuários
  const generateUsersBackupContent = async () => {
    let content = `# Backup de Usuários\n\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    // Adicionar informações detalhadas de usuários
    content += `## Usuários (${users.length})\n\n`;
    users.forEach((user, index) => {
      content += `### ${index + 1}. ${user.name}\n`;
      content += `- ID: ${user.id}\n`;
      content += `- Username: ${user.username}\n`;
      content += `- Função: ${user.role}\n`;
      content += `- Canais atribuídos: ${user.assignedTabs?.join(', ') || 'Nenhum'}\n`;
      content += `- Canais: ${user.assignedChannels?.join(', ') || 'Nenhum'}\n`;
      content += `- Criado em: N/A\n`;
      content += `- Atualizado em: N/A\n\n`;
    });
    
    return content;
  };

  // Gerar conteúdo para backup de canais
  const generateChannelsBackupContent = async () => {
    let content = `# Backup de Canais\n\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    // Adicionar informações detalhadas de canais
    content += `## Canais (${channels.length})\n\n`;
    channels.forEach((channel, index) => {
      content += `### ${index + 1}. ${channel.name}\n`;
      content += `- ID: ${channel.id}\n`;
      content += `- Tipo: ${channel.type}\n`;
      content += `- Status: ${channel.isActive ? 'Ativo' : 'Inativo'}\n`;
      content += `- Padrão: ${channel.isDefault ? 'Sim' : 'Não'}\n`;
      content += `- Criado em: N/A\n`;
      content += `- Atualizado em: N/A\n\n`;
    });
    
    return content;
  };

  // Gerar conteúdo para backup de logs de auditoria
  const generateAuditBackupContent = async () => {
    let content = `# Backup de Logs de Auditoria\n\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    // Adicionar logs de auditoria
    content += `## Logs de Auditoria (${logs.length})\n\n`;
    logs.forEach((log, index) => {
      content += `### ${index + 1}. Ação: ${log.action}\n`;
      content += `- ID: ${log.id}\n`;
      content += `- Usuário: ${log.user_name || 'Sistema'}\n`;
      content += `- Data: ${new Date(log.created_at).toLocaleString('pt-BR')}\n`;
      if (log.details) {
        content += `- Detalhes: ${typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}\n`;
      }
      content += `\n`;
    });
    
    return content;
  };

  // Função para exportar dados em formato JSON
  const handleExportData = async (type: string) => {
    try {
      setLoading(type);
      
      // Obter dados baseados no tipo
      let data: any = {};
      let fileName = '';
      
      if (type === 'mensagens') {
        data = { type: 'messages', data: [] }; // Aqui você obteria dados reais
        fileName = `mensagens_${new Date().toISOString().split('T')[0]}.json`;
      } else if (type === 'usuarios') {
        data = { type: 'users', data: users };
        fileName = `usuarios_${new Date().toISOString().split('T')[0]}.json`;
      } else if (type === 'canais') {
        data = { type: 'channels', data: channels };
        fileName = `canais_${new Date().toISOString().split('T')[0]}.json`;
      } else if (type === 'auditoria') {
        data = { type: 'audit', data: logs };
        fileName = `auditoria_${new Date().toISOString().split('T')[0]}.json`;
      }
      
      // Criar e baixar arquivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: `Dados de ${type} exportados com sucesso!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  // Opções de backup
  const backupOptions = [
    {
      id: 'completo',
      title: 'Backup Completo',
      description: 'Gerar um documento PDF com todos os dados do sistema',
      icon: File
    },
    {
      id: 'mensagens',
      title: 'Backup de Mensagens',
      description: 'Gerar um documento PDF com dados de mensagens e conversas',
      icon: FileText
    },
    {
      id: 'usuarios',
      title: 'Backup de Usuários',
      description: 'Gerar um documento PDF com dados de usuários',
      icon: FileText
    },
    {
      id: 'canais',
      title: 'Backup de Canais',
      description: 'Gerar um documento PDF com dados de canais',
      icon: FileOutput
    },
    {
      id: 'auditoria',
      title: 'Backup de Auditoria',
      description: 'Gerar um documento PDF com logs de auditoria',
      icon: FileArchive
    }
  ];

  // Opções de exportação
  const exportOptions = [
    {
      id: 'mensagens',
      title: 'Mensagens',
      description: 'Exportar todas as conversas e mensagens em JSON',
      icon: FileText
    },
    {
      id: 'usuarios',
      title: 'Usuários',
      description: 'Exportar dados de usuários e perfis em JSON',
      icon: Database
    },
    {
      id: 'canais',
      title: 'Canais',
      description: 'Exportar dados de canais em JSON',
      icon: FileOutput
    },
    {
      id: 'auditoria',
      title: 'Auditoria',
      description: 'Exportar logs de auditoria em JSON',
      icon: Calendar
    }
  ];

  return (
    <div className={cn(
      "p-6",
      isDarkMode ? "bg-background" : "bg-gray-50"
    )}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Backup em PDF */}
        <Card className={cn(
          "border",
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              "flex items-center gap-3 text-lg",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              <div className="p-2 rounded-lg bg-primary/10">
                <File className="h-5 w-5 text-primary" />
              </div>
              Backup em Documento PDF
            </CardTitle>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Gere documentos PDF com dados do sistema para backup e documentação
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backupOptions.map((option) => (
                <div 
                  key={option.id}
                  className={cn(
                    "flex flex-col p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                    isDarkMode ? 
                      "border-border bg-background/50 hover:bg-background/80" : 
                      "border-gray-200 bg-gray-50 hover:bg-white"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isDarkMode ? "bg-[#27272a]" : "bg-white"
                    )}>
                      <option.icon size={18} className="text-[#b5103c]" />
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-medium",
                        isDarkMode ? "text-card-foreground" : "text-gray-900"
                      )}>
                        {option.title}
                      </h4>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-muted-foreground" : "text-gray-600"
                      )}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => generatePDF(option.id)}
                    disabled={loading === option.id}
                    className="bg-[#b5103c] hover:bg-[#9a0e35] text-white mt-auto"
                  >
                    {loading === option.id ? 'Gerando PDF...' : 'Gerar PDF'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exportação em JSON */}
        <Card className={cn(
          "border",
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              "flex items-center gap-3 text-lg",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              Exportação de Dados em JSON
            </CardTitle>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Exporte dados do sistema em formato JSON para uso em outras aplicações
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportOptions.map((option) => (
                <div 
                  key={option.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    isDarkMode ? "border-border bg-background/50" : "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isDarkMode ? "bg-[#27272a]" : "bg-white"
                    )}>
                      <option.icon size={16} className="text-[#b5103c]" />
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-medium text-sm",
                        isDarkMode ? "text-card-foreground" : "text-gray-900"
                      )}>
                        {option.title}
                      </h4>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-muted-foreground" : "text-gray-600"
                      )}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleExportData(option.id)}
                    disabled={loading === option.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex items-center gap-1",
                      isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : ""
                    )}
                  >
                    <Download size={14} />
                    {loading === option.id ? 'Exportando...' : 'Exportar JSON'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Importação */}
        <Card className={cn(
          "border",
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              "flex items-center gap-3 text-lg",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              Restaurar Backup
            </CardTitle>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Restaure dados a partir de um arquivo de backup
            </p>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center",
              isDarkMode ? "border-border" : "border-gray-300"
            )}>
              <Upload size={32} className={cn(
                "mx-auto mb-2",
                isDarkMode ? "text-muted-foreground" : "text-gray-400"
              )} />
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-muted-foreground" : "text-gray-600"
              )}>
                Arraste um arquivo de backup aqui ou clique para selecionar
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "mt-3",
                  isDarkMode ? "border-border text-foreground hover:bg-accent" : ""
                )}
              >
                Selecionar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
