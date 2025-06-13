import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaProcessor } from '@/services/MediaProcessor';

interface WhatsAppAudioPlayerProps {
  audioContent: string;
  isDarkMode?: boolean;
  messageId: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export const WhatsAppAudioPlayer: React.FC<WhatsAppAudioPlayerProps> = ({
  audioContent,
  isDarkMode = false,
  messageId,
  onLoadStart,
  onLoadEnd,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Processar áudio na inicialização
  useEffect(() => {
    console.log('🎵 [WHATSAPP_AUDIO_PLAYER] Processing audio for message:', messageId);
    
    const result = MediaProcessor.processAudio(audioContent);
    
    if (result.isProcessed && result.url) {
      console.log('✅ [WHATSAPP_AUDIO_PLAYER] Audio processed successfully:', {
        messageId,
        mimeType: result.mimeType,
        size: result.size
      });
      setAudioUrl(result.url);
      setHasError(false);
    } else {
      console.error('❌ [WHATSAPP_AUDIO_PLAYER] Failed to process audio:', result.error);
      setHasError(true);
      onError?.();
    }
  }, [audioContent, messageId, onError]);

  // Configurar eventos do áudio quando URL estiver disponível
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    let loadTimeout: NodeJS.Timeout;

    const handleLoadStart = () => {
      console.log('🎵 [WHATSAPP_AUDIO_PLAYER] Load start:', messageId);
      onLoadStart?.();
    };

    const handleLoadedMetadata = () => {
      console.log('🎵 [WHATSAPP_AUDIO_PLAYER] Metadata loaded:', messageId, 'duration:', audio.duration);
      
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
        onLoadEnd?.();
        clearTimeout(loadTimeout);
      }
    };

    const handleCanPlay = () => {
      console.log('🎵 [WHATSAPP_AUDIO_PLAYER] Can play:', messageId);
      if (!isLoaded && audio.duration) {
        setDuration(audio.duration);
        setIsLoaded(true);
        onLoadEnd?.();
        clearTimeout(loadTimeout);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) {
        audio.currentTime = 0;
      }
    };

    const handleError = (e: Event) => {
      console.error('❌ [WHATSAPP_AUDIO_PLAYER] Error loading audio:', messageId, e);
      setIsLoaded(false);
      setHasError(true);
      onError?.();
      clearTimeout(loadTimeout);
    };

    // Timeout para evitar loading infinito
    loadTimeout = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn('⚠️ [WHATSAPP_AUDIO_PLAYER] Load timeout:', messageId);
        setHasError(true);
        onError?.();
      }
    }, 8000);

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Configurar volume e velocidade
    audio.volume = volume;
    audio.muted = isMuted;
    audio.playbackRate = playbackRate;

    // Tentar carregar
    audio.load();

    return () => {
      clearTimeout(loadTimeout);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, messageId, isLoaded, hasError, onLoadStart, onLoadEnd, onError, volume, isMuted, playbackRate]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('❌ [WHATSAPP_AUDIO_PLAYER] Play error:', error);
            setHasError(true);
          });
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.muted = newMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !isLoaded) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const resetAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    audio.pause();
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  // Estado de erro
  if (hasError) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg max-w-[280px]",
        isDarkMode ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
      )}>
        <AlertCircle className="text-red-500" size={16} />
        <span className={cn(
          "text-xs",
          isDarkMode ? "text-red-300" : "text-red-600"
        )}>
          Erro ao carregar áudio
        </span>
      </div>
    );
  }

  // Estado de carregamento
  if (!isLoaded && !hasError) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg max-w-[280px]",
        isDarkMode ? "bg-gray-700" : "bg-gray-100"
      )}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
        <span className={cn(
          "text-xs",
          isDarkMode ? "text-gray-300" : "text-gray-600"
        )}>
          Carregando...
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "whatsapp-audio-player p-3 rounded-lg max-w-[280px] space-y-2",
      isDarkMode ? "bg-[#272728] border border-[#363537]" : "bg-gray-50 border border-gray-200"
    )}>
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      
      {/* Linha principal - Controles e tempo */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button - Estilo WhatsApp */}
        <button
          onClick={togglePlayPause}
          disabled={!isLoaded || hasError}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
            "bg-[#25d366] text-white hover:bg-[#20b858] shadow-sm",
            (!isLoaded || hasError) && "opacity-50 cursor-not-allowed",
            isPlaying && "scale-95"
          )}
        >
          {isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </button>

        {/* Barra de progresso - Estilo WhatsApp */}
        <div className="flex-1 flex items-center gap-2">
          <div 
            ref={progressRef}
            className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-1 cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
          >
            <div 
              className="bg-[#25d366] h-1 rounded-full transition-all duration-150 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-0 w-2 h-2 bg-[#25d366] rounded-full shadow-sm transform -translate-y-0.5 translate-x-1"></div>
            </div>
          </div>
          
          {/* Tempo - Estilo WhatsApp */}
          <div className={cn(
            "text-xs font-mono",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Controles secundários */}
        <div className="flex items-center gap-1">
          <button
            onClick={changePlaybackRate}
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono transition-colors",
              isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-200 text-gray-600"
            )}
            title="Velocidade de reprodução"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
      
      {/* Linha de volume - Compacta */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className={cn(
            "p-1 rounded-full transition-colors",
            isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-200 text-gray-600"
          )}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={12} />
          ) : (
            <Volume2 size={12} />
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className={cn(
            "flex-1 h-1 rounded-lg appearance-none cursor-pointer",
            "bg-gray-300 dark:bg-gray-600",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#25d366] [&::-webkit-slider-thumb]:cursor-pointer"
          )}
        />
        
        <span className={cn(
          "text-xs font-mono w-6 text-right",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )}>
          {Math.round((isMuted ? 0 : volume) * 100)}
        </span>

        <button
          onClick={resetAudio}
          className={cn(
            "p-1 rounded-full transition-colors",
            isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-200 text-gray-600"
          )}
          title="Reiniciar"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
};

