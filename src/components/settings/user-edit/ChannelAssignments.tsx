
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useChannels } from '@/contexts/ChannelContext';

interface ChannelAssignmentsProps {
  assignedChannels: string[];
  onChannelToggle: (channelId: string) => void;
  isDarkMode: boolean;
}

export const ChannelAssignments: React.FC<ChannelAssignmentsProps> = ({
  assignedChannels,
  onChannelToggle,
  isDarkMode
}) => {
  const { channels } = useChannels();

  // Only show active channels with a valid name, excluding Pedro
  const filteredChannels = channels.filter(
    ch => ch.isActive && ch.name && ch.name.toLowerCase() !== 'pedro'
  );

  return (
    <div className="space-y-2">
      <Label className={cn(
        isDarkMode ? "text-stone-200" : "text-gray-700"
      )}>Canais atribuídos</Label>
      <div className="space-y-2 max-h-36 overflow-y-auto border rounded p-2" style={{
        backgroundColor: isDarkMode ? '#3a3a3a' : '#f9f9f9',
        borderColor: isDarkMode ? '#686868' : '#d1d5db'
      }}>
        {filteredChannels.map(channel => (
          <div key={channel.id} className="flex items-center space-x-2">
            <Checkbox
              id={`channel-${channel.id}`}
              checked={assignedChannels.includes(channel.id)}
              onCheckedChange={() => onChannelToggle(channel.id)}
            />
            <Label htmlFor={`channel-${channel.id}`} className={cn(
              "text-sm",
              isDarkMode ? "text-stone-300" : "text-gray-700"
            )}>
              {channel.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
