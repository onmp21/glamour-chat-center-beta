
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, RotateCcw, Unlink, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelMapping {
  id: string;
  channelId: string;
  instanceId: string;
  instanceName: string;
  channelName: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InstanceInfo {
  instanceName: string;
  profileName?: string;
}

interface AvailableChannel {
  id: string;
  name: string;
}

interface ChannelMappingSectionProps {
  channelMappings: ChannelMapping[];
  availableChannels: AvailableChannel[];
  instances: InstanceInfo[];
  selectedChannelForMapping: string;
  setSelectedChannelForMapping: (channelId: string) => void;
  selectedInstanceForMapping: string;
  setSelectedInstanceForMapping: (instanceId: string) => void;
  linkingChannel: boolean;
  onLinkChannel: () => void;
  onUnlinkChannel: (mappingId: string) => void;
  isDarkMode: boolean;
}

export const ChannelMappingSection: React.FC<ChannelMappingSectionProps> = ({
  channelMappings,
  availableChannels,
  instances,
  selectedChannelForMapping,
  setSelectedChannelForMapping,
  selectedInstanceForMapping,
  setSelectedInstanceForMapping,
  linkingChannel,
  onLinkChannel,
  onUnlinkChannel,
  isDarkMode
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { color: 'bg-green-500', text: 'Conectado', icon: Wifi },
      'close': { color: 'bg-red-500', text: 'Desconectado', icon: WifiOff }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.close;
    const Icon = config.icon;

    return (
      <Badge className={cn("text-white", config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "border-2",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Vincular Canal à Instância
        </CardTitle>
        <CardDescription>
          Associe um canal de comunicação a uma instância da API Evolution usando o novo webhook universal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <Label htmlFor="selectChannel">Selecionar Canal</Label>
            <Select
              onValueChange={setSelectedChannelForMapping}
              value={selectedChannelForMapping}
              disabled={linkingChannel}
            >
              <SelectTrigger
                id="selectChannel"
                className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              >
                <SelectValue placeholder="Selecione um canal" />
              </SelectTrigger>
              <SelectContent className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300 text-gray-900")}>
                {availableChannels.map(channel => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="selectInstance">Selecionar Instância</Label>
            <Select
              onValueChange={setSelectedInstanceForMapping}
              value={selectedInstanceForMapping}
              disabled={linkingChannel}
            >
              <SelectTrigger
                id="selectInstance"
                className={cn(
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
                )}
              >
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300 text-gray-900")}>
                {instances.map(instance => (
                  <SelectItem key={instance.instanceName} value={instance.instanceName}>
                    {instance.instanceName}
                    {instance.profileName && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({instance.profileName})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={onLinkChannel}
          disabled={linkingChannel || !selectedChannelForMapping || !selectedInstanceForMapping}
          className={cn(
            "w-full bg-green-600 hover:bg-green-700 text-white",
            (linkingChannel || !selectedChannelForMapping || !selectedInstanceForMapping) && "bg-gray-400 hover:bg-gray-400"
          )}
        >
          {linkingChannel ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              Configurando novo webhook...
            </>
          ) : (
            <>
              <Link className="mr-2 h-4 w-4" />
              Vincular Canal
            </>
          )}
        </Button>

        <div className="space-y-2">
          <Label>Canais Vinculados:</Label>
          {channelMappings.length === 0 ? (
            <p className="text-gray-500">Nenhum canal vinculado.</p>
          ) : (
            channelMappings.map((mapping) => (
              <div
                key={mapping.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-md",
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center gap-2">
                  {getStatusBadge(mapping.isActive ? 'open' : 'close')}
                  <span className="font-semibold">{mapping.channelName}</span>
                  <span className="text-sm text-gray-500">({mapping.instanceName})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnlinkChannel(mapping.id)}
                    className={cn(
                      isDarkMode ? "border-[#3f3f46] text-white" : "border-gray-300 text-gray-700"
                    )}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Desvincular
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
