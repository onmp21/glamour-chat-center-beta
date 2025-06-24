
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
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
        "flex items-center space-x-2 p-2 rounded-lg",
        balloonColor === 'sent' 
          ? "bg-[#b5103c] text-white" 
          : isDarkMode 
            ? "bg-[#18181b] text-white" 
            : "bg-white text-gray-900",
        className
      )}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        <span className="text-sm">Carregando áudio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center space-x-2 p-2 rounded-lg",
        balloonColor === 'sent' 
          ? "bg-[#b5103c] text-white" 
          : isDarkMode 
            ? "bg-[#18181b] text-white" 
            : "bg-white text-gray-900",
        className
      )}>
        <Volume2 size={16} />
        <span className="text-sm">Erro ao carregar áudio</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center space-x-3 p-2 rounded-lg min-w-[200px]",
      balloonColor === 'sent' 
        ? "bg-[#b5103c] text-white" 
        : isDarkMode 
          ? "bg-[#18181b] text-white" 
          : "bg-white text-gray-900",
      className
    )}>
      <audio ref={audioRef} src={audioSrc} />
      
      <button
        onClick={togglePlayPause}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
          balloonColor === 'sent' 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : isDarkMode 
              ? "bg-gray-600 hover:bg-gray-500 text-white" 
              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
        )}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <div className="flex-1 space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className={cn(
            "w-full h-1 rounded-lg appearance-none cursor-pointer",
            balloonColor === 'sent' 
              ? "bg-white/20" 
              : isDarkMode 
                ? "bg-gray-600" 
                : "bg-gray-300"
          )}
        />
        
        <div className="flex justify-between text-xs opacity-75">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
