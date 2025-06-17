
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MessageCircle, Users, AlertTriangle } from 'lucide-react';
import { useRecentActivities } from '@/hooks/useRecentActivities';

interface RecentActivitiesSectionProps {
  isDarkMode: boolean;
}

export const RecentActivitiesSection: React.FC<RecentActivitiesSectionProps> = ({ 
  isDarkMode 
}) => {
  const { activities, loading } = useRecentActivities();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return MessageCircle;
      case 'status_change':
        return AlertTriangle;
      case 'new_conversation':
        return Users;
      default:
        return Activity;
    }
  };

  if (loading) {
    return (
      <Card className={cn(
        "border-0 shadow-sm",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl flex items-center gap-3",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            <Activity className="text-[#b5103c]" size={24} />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
                <div className="w-12 h-3 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-0 shadow-sm",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <CardHeader>
        <CardTitle className={cn(
          "text-xl flex items-center gap-3",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          <Activity className="text-[#b5103c]" size={24} />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className={cn(
              "mx-auto mb-4",
              isDarkMode ? "text-gray-600" : "text-gray-400"
            )} size={48} />
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Nenhuma atividade recente encontrada
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg transition-colors",
                  isDarkMode ? "hover:bg-[#27272a]" : "hover:bg-gray-50"
                )}>
                  <div className="p-2 rounded-full bg-[#b5103c]/10 text-[#b5103c] flex-shrink-0">
                    <IconComponent size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>
                        {activity.title}
                      </p>
                      <span className={cn(
                        "text-xs flex-shrink-0 ml-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        {activity.time}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mb-1",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      {activity.description}
                    </p>
                    <p className={cn(
                      "text-xs truncate",
                      isDarkMode ? "text-zinc-300" : "text-gray-600"
                    )}>
                      {activity.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
