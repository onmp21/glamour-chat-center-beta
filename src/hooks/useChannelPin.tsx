
import { useState, useEffect } from 'react';

export const useChannelPin = () => {
  const [pinnedChannels, setPinnedChannels] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pinnedChannels');
    if (saved) {
      setPinnedChannels(JSON.parse(saved));
    }
  }, []);

  const togglePin = (channelId: string) => {
    const newPinned = pinnedChannels.includes(channelId)
      ? pinnedChannels.filter(id => id !== channelId)
      : [...pinnedChannels, channelId];
    
    setPinnedChannels(newPinned);
    localStorage.setItem('pinnedChannels', JSON.stringify(newPinned));
  };

  const isPinned = (channelId: string) => pinnedChannels.includes(channelId);

  return { pinnedChannels, togglePin, isPinned };
};
