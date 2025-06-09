import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  MessageCircle, 
  TrendingUp,
  Filter,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react';

interface ReportDashboardEnhancedProps {
  isDarkMode: boolean;
}

export const ReportDashboardEnhanced: React.FC<ReportDashboardEnhancedProps> = ({
  isDarkMode
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  const stats = [
    {
      title: 'Total de Conversas',
      value: '1,234',
      change: '+12%',
      icon: MessageCircle,
      color: 'text-blue-600'
    },
    {
      title: 'Usuários Ativos',
      value: '856',
      change: '+8%',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Taxa de Resposta',
      value: '94%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Relatórios Gerados',
      value: '45',
      change: '+15%',
      icon: FileText,
      color: 'text-orange-600'
    }
  ];

  const recentReports = [
    {
      id: 1,
      name: 'Relatório de Conversas - Dezembro',
      type: 'Conversas',
      date: '2024-12-15',
      status: 'Concluído',
      size: '2.3 MB'
    },
    {
      id: 2,
      name: 'Análise de Performance - Semanal',
      type: 'Performance',
      date: '2024-12-14',
      status: 'Processando',
      size: '1.8 MB'
    },
    {
      id: 3,
      name: 'Relatório de Atendimento - Novembro',
      type: 'Atendimento',
      date: '2024-12-10',
      status: 'Concluído',
      size: '3.1 MB'
    }
  ];

  const reportTypes = [
    {
      name: 'Relatório de Conversas',
      description: 'Análise detalhada das conversas por período',
      icon: MessageCircle,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    },
    {
      name: 'Relatório de Performance',
      description: 'Métricas de performance e tempo de resposta',
      icon: BarChart3,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
    },
    {
      name: 'Relatório de Usuários',
      description: 'Análise de usuários ativos e engajamento',
      icon: Users,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen p-6 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Central de Relatórios
        </h1>
        <p className="text-lg text-muted-foreground">
          Análises e relatórios detalhados do sistema
        </p>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === '7d' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('7d')}
            size="sm"
          >
            7 dias
          </Button>
          <Button
            variant={selectedPeriod === '30d' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('30d')}
            size="sm"
          >
            30 dias
          </Button>
          <Button
            variant={selectedPeriod === '90d' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('90d')}
            size="sm"
          >
            90 dias
          </Button>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-green-600">
                    {stat.change}
                  </Badge>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tipos de Relatórios */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Tipos de Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportTypes.map((type, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border hover:border-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {type.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Gerar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Relatórios Recentes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Relatórios Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">
                      {report.name}
                    </h3>
                    <Badge
                      variant={report.status === 'Concluído' ? 'default' : 'secondary'}
                      className={
                        report.status === 'Concluído'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(report.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-muted-foreground">
                      {report.size}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                    {report.status === 'Concluído' && (
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
