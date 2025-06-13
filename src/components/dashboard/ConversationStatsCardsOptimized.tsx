
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useOptimizedConversationStats } from '@/hooks/useOptimizedConversationStats';
import { cn } from '@/lib/utils';

interface ConversationStatsCardsOptimizedProps {
  isDarkMode: boolean;
}

export const ConversationStatsCardsOptimized: React.FC<ConversationStatsCardsOptimizedProps> = ({ isDarkMode }) => {
  const { stats, loading } = useOptimizedConversationStats();

  const statsCards = [
    {
      title: 'Total de Conversas',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: isDarkMode ? 'bg-blue-950' : 'bg-blue-50'
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: isDarkMode ? 'bg-yellow-950' : 'bg-yellow-50'
    },
    {
      title: 'Resolvidas',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: isDarkMode ? 'bg-green-950' : 'bg-green-50'
    },
    {
      title: 'Mensagens Não Lidas',
      value: stats.unreadMessages,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: isDarkMode ? 'bg-red-950' : 'bg-red-50'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-300 rounded animate-pulse w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-sm font-medium", isDarkMode ? "text-[#fafafa]" : "text-gray-900")}>
              {stat.title}
            </CardTitle>
            <div className={cn("p-2 rounded-md", stat.bgColor)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", isDarkMode ? "text-[#fafafa]" : "text-gray-900")}>
              {stat.value.toLocaleString()}
            </div>
            <p className={cn("text-xs", isDarkMode ? "text-[#a1a1aa]" : "text-gray-500")}>
              {stat.title === 'Mensagens Não Lidas' && stat.value > 0 && (
                <span className="text-red-500 font-medium">
                  Requer atenção
                </span>
              )}
              {stat.title === 'Pendentes' && stat.value === 0 && (
                <span className="text-green-500 font-medium">
                  Tudo em dia
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
