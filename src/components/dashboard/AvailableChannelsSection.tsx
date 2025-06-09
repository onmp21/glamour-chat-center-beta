
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare, Users, Building, Store, User } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  conversationCount: number;
}

interface AvailableChannelsSectionProps {
  channels: Channel[];
  isDarkMode: boolean;
  onChannelClick: (channelId: string) => void;
}

const getChannelIcon = (name: string) => {
  if (name.includes('Canarana')) return <Store className="w-5 h-5" />;
  if (name.includes('Souto Soares')) return <Building className="w-5 h-5" />;
  if (name.includes('João Dourado')) return <Users className="w-5 h-5" />;
  if (name.includes('América Dourada')) return <Building className="w-5 h-5" />;
  if (name.includes('Gerente')) return <User className="w-5 h-5" />;
  return <MessageSquare className="w-5 h-5" />;
};

export const AvailableChannelsSection: React.FC<AvailableChannelsSectionProps> = ({
  channels,
  isDarkMode,
  onChannelClick
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#b5103c]/10">
          <MessageSquare size={20} className="text-[#b5103c]" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Canais Disponíveis
          </h2>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-[#a1a1aa]" : "text-gray-600"
          )}>
            Acesse rapidamente seus canais de atendimento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {channels.map((channel) => (
          <Card 
            key={channel.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2",
              isDarkMode 
                ? "bg-zinc-800 border-zinc-700 hover:border-zinc-600" 
                : "bg-white border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onChannelClick(channel.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#b5103c] text-white">
                  {getChannelIcon(channel.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-medium truncate text-sm",
                    isDarkMode ? "text-zinc-100" : "text-gray-900"
                  )}>
                    {channel.name}
                  </h3>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-zinc-400" : "text-gray-500"
                  )}>
                    Canal ativo
                  </p>
                </div>
                
                {channel.conversationCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium"
                  >
                    {channel.conversationCount}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
