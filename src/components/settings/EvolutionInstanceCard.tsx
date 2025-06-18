
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  status: string;
  serverUrl: string;
  apikey: string;
}

interface EvolutionInstanceCardProps {
  evolutionInstance: EvolutionInstance;
  index: number;
  isDarkMode?: boolean;
}

export const EvolutionInstanceCard: React.FC<EvolutionInstanceCardProps> = ({
  evolutionInstance,
  index,
  isDarkMode = false
}) => {
  return (
    <Card key={`${evolutionInstance.instanceId}-${index}`} className={cn(
      "transition-all duration-200",
      isDarkMode ? "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]" : "bg-white border-gray-200 hover:border-gray-300"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-base", isDarkMode ? "text-white" : "text-gray-900")}>
            {evolutionInstance.instanceName}
          </CardTitle>
          <Badge variant={evolutionInstance.status === 'open' ? 'default' : 'destructive'}>
            {evolutionInstance.status === 'open' ? (
              <Wifi className="h-3 w-3 mr-1" />
            ) : (
              <WifiOff className="h-3 w-3 mr-1" />
            )}
            {evolutionInstance.status === 'open' ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div>
            <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
              ID da Instância:
            </span>
            <p className={cn("text-sm font-mono", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
              {evolutionInstance.instanceId}
            </p>
          </div>
          {evolutionInstance.profileName && (
            <div>
              <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                Nome do Perfil:
              </span>
              <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                {evolutionInstance.profileName}
              </p>
            </div>
          )}
          {evolutionInstance.owner && (
            <div>
              <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-gray-700")}>
                Proprietário:
              </span>
              <p className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                {evolutionInstance.owner}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
