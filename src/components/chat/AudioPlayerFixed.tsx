
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerFixedProps {
  audioSrc: string;
  isDarkMode?: boolean;
  balloonColor?: 'sent' | 'received';
  className?: string;
}

export const AudioPlayerFixed: React.FC<AudioPlayerFixedProps> = ({
  audioSrc,
  isDarkMode = false,
  balloonColor = 'received',
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setError(true);
      setLoading(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [audioSrc]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (loading) {
    return (
      <div className={cn(
        "flex items-center space-x-2 p-2 rounded-lg min-w-[180px]",
        className
      )}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current opacity-60"></div>
        <span className="text-xs opacity-70">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center space-x-2 p-2 rounded-lg min-w-[180px]",
        className
      )}>
        <div className="w-4 h-4 rounded-full bg-red-500 opacity-60"></div>
        <span className="text-xs opacity-70">Erro no áudio</span>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center space-x-2 p-2 rounded-lg min-w-[180px] max-w-[240px]",
      className
    )}>
      <audio ref={audioRef} src={audioSrc} />
      
      <button
        onClick={togglePlayPause}
        className="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)'
        }}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="relative h-1 bg-black bg-opacity-10 rounded-full mb-1 overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-white bg-opacity-60 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="flex justify-between text-xs opacity-60 leading-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
