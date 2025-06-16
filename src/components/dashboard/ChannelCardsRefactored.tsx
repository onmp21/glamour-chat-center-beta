
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare, Users, Phone, Store, Building, User } from 'lucide-react';

interface ChannelCardProps {
  id: string;
  name: string;
  conversationCount: number;
  isDarkMode: boolean;
  onClick: () => void;
}

const getChannelIcon = (name: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Yelena': <MessageSquare className="w-5 h-5" />,
    'Canarana': <Store className="w-5 h-5" />,
    'Souto Soares': <Building className="w-5 h-5" />,
    'João Dourado': <Users className="w-5 h-5" />,
    'América Dourada': <Building className="w-5 h-5" />,
    'Gerente Lojas': <Store className="w-5 h-5" />,
    'Gerente Externo': <User className="w-5 h-5" />,
    'Pedro': <Phone className="w-5 h-5" />
  };
  
  return iconMap[name] || <MessageSquare className="w-5 h-5" />;
};

export const ChannelCard: React.FC<ChannelCardProps> = ({
  id,
  name,
  conversationCount,
  isDarkMode,
  onClick
}) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2",
        isDarkMode 
          ? "bg-zinc-800 border-zinc-700 hover:border-zinc-600" 
          : "bg-white border-gray-200 hover:border-gray-300"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#b5103c] text-white">
            {getChannelIcon(name)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium truncate text-sm",
              isDarkMode ? "text-zinc-100" : "text-gray-900"
            )}>
              {name}
            </h3>
            <p className={cn(
              "text-xs",
              isDarkMode ? "text-zinc-400" : "text-gray-500"
            )}>
              Canal de atendimento
            </p>
          </div>
          
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs font-medium",
              conversationCount > 0 
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            )}
          >
            {conversationCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

interface ChannelCardsGridProps {
  channels: Array<{
    id: string;
    name: string;
    conversationCount: number;
  }>;
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
}

export const ChannelCardsGrid: React.FC<ChannelCardsGridProps> = ({
  channels,
  isDarkMode,
  onChannelClick
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          id={channel.id}
          name={channel.name}
          conversationCount={channel.conversationCount}
          isDarkMode={isDarkMode}
          onClick={() => onChannelClick(channel.id)}
        />
      ))}
    </div>
  );
};
