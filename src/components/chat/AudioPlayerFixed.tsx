import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaProcessor } from '@/services/MediaProcessor';

interface AudioPlayerFixedProps {
  audioContent: string;
  isDarkMode?: boolean;
  messageId: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  balloonColor?: 'sent' | 'received';
}

export const AudioPlayerFixed: React.FC<AudioPlayerFixedProps> = ({
  audioContent,
  isDarkMode = false,
  messageId,
  onLoadStart,
  onLoadEnd,
  onError,
  balloonColor = 'received'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Processar áudio na inicialização
  useEffect(() => {
    console.log('🎵 [AUDIO_PLAYER] Processing audio for message:', messageId);
    
    const result = MediaProcessor.processAudio(audioContent);
    
    if (result.isProcessed && result.url) {
      console.log('✅ [AUDIO_PLAYER] Audio processed successfully:', {
        messageId,
        mimeType: result.mimeType,
        size: result.size
      });
      setAudioUrl(result.url);
      setHasError(false);
    } else {
      console.error('❌ [AUDIO_PLAYER] Failed to process audio:', result.error);
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
      console.log('🎵 [AUDIO_PLAYER] Load start:', messageId);
      onLoadStart?.();
    };

    const handleLoadedMetadata = () => {
      console.log('🎵 [AUDIO_PLAYER] Metadata loaded:', messageId, 'duration:', audio.duration);
      
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
        onLoadEnd?.();
        clearTimeout(loadTimeout);
      }
    };

    const handleCanPlay = () => {
      console.log('🎵 [AUDIO_PLAYER] Can play:', messageId);
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
      console.error('❌ [AUDIO_PLAYER] Error loading audio:', messageId, e);
      setIsLoaded(false);
      setHasError(true);
      onError?.();
      clearTimeout(loadTimeout);
    };

    // Timeout para evitar loading infinito
    loadTimeout = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn('⚠️ [AUDIO_PLAYER] Load timeout:', messageId);
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

    // Configurar velocidade
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
  }, [audioUrl, messageId, isLoaded, hasError, onLoadStart, onLoadEnd, onError, playbackRate]);

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
            console.error('❌ [AUDIO_PLAYER] Play error:', error);
            setHasError(true);
          });
      }
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

  const changePlaybackRate = () => {
    const rates = [1, 1.5, 2];
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

  // Definir cores baseadas no balão - estilo WhatsApp
  const getPlayerColors = () => {
    if (balloonColor === 'sent') {
      // Cores para mensagens enviadas (balão vermelho #b5103c)
      return {
        background: '#b5103c',
        text: '#ffffff',
        playButton: '#ffffff',
        playButtonBg: 'rgba(255, 255, 255, 0.2)',
        playButtonHover: 'rgba(255, 255, 255, 0.3)',
        progressBg: 'rgba(255, 255, 255, 0.3)',
        progressFill: '#ffffff',
        timeText: 'rgba(255, 255, 255, 0.8)',
        speedButton: 'rgba(255, 255, 255, 0.7)'
      };
    } else {
      // Cores para mensagens recebidas baseadas no modo
      if (isDarkMode) {
        // Modo escuro - balão recebido (#272728)
        return {
          background: '#272728',
          text: '#ffffff',
          playButton: '#ffffff',
          playButtonBg: 'rgba(255, 255, 255, 0.15)',
          playButtonHover: 'rgba(255, 255, 255, 0.25)',
          progressBg: 'rgba(255, 255, 255, 0.2)',
          progressFill: '#ffffff',
          timeText: 'rgba(255, 255, 255, 0.7)',
          speedButton: 'rgba(255, 255, 255, 0.6)'
        };
      } else {
        // Modo claro - balão recebido (#ffffff)
        return {
          background: '#ffffff',
          text: '#374151',
          playButton: '#374151',
          playButtonBg: 'rgba(55, 65, 81, 0.1)',
          playButtonHover: 'rgba(55, 65, 81, 0.15)',
          progressBg: 'rgba(0, 0, 0, 0.1)',
          progressFill: '#374151',
          timeText: 'rgba(0, 0, 0, 0.6)',
          speedButton: 'rgba(0, 0, 0, 0.5)'
        };
      }
    }
  };

  const colors = getPlayerColors();

  // Estado de erro
  if (hasError) {
    return (
      <div 
        className="flex items-center gap-2 p-3 rounded-2xl max-w-[280px] shadow-sm"
        style={{ backgroundColor: colors.background }}
      >
        <AlertCircle className="text-red-500" size={20} />
        <span className="text-sm" style={{ color: colors.text }}>
          Erro ao carregar áudio
        </span>
      </div>
    );
  }

  // Estado de carregamento
  if (!isLoaded && !hasError) {
    return (
      <div 
        className="flex items-center gap-3 p-3 rounded-2xl max-w-[280px] shadow-sm"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: colors.progressBg, borderTopColor: colors.progressFill }}
        ></div>
        <span className="text-sm" style={{ color: colors.text }}>
          Carregando...
        </span>
      </div>
    );
  }

  return (
    <div 
      className="p-3 rounded-2xl max-w-[280px] shadow-sm"
      style={{ 
        backgroundColor: colors.background,
        border: balloonColor === 'received' && !isDarkMode ? '1px solid #e5e7eb' : 'none'
      }}
    >
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      
      <div className="flex items-center gap-3">
        {/* Play/Pause Button - estilo WhatsApp */}
        <button
          onClick={togglePlayPause}
          disabled={!isLoaded || hasError}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.playButtonBg,
            color: colors.playButton,
            opacity: (!isLoaded || hasError) ? 0.5 : 1,
            cursor: (!isLoaded || hasError) ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (isLoaded && !hasError) {
              e.currentTarget.style.backgroundColor = colors.playButtonHover;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.playButtonBg;
          }}
        >
          {isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* Waveform visual e informações */}
        <div className="flex-1 space-y-1">
          {/* Barra de progresso estilo WhatsApp */}
          <div 
            ref={progressRef}
            className="w-full rounded-full h-1 cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: colors.progressBg }}
            onClick={handleProgressClick}
          >
            <div 
              className="h-1 rounded-full transition-all duration-150"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: colors.progressFill
              }}
            />
          </div>
          
          {/* Tempo e velocidade */}
          <div className="flex items-center justify-between">
            <span 
              className="text-xs"
              style={{ color: colors.timeText }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            {playbackRate !== 1 && (
              <button
                onClick={changePlaybackRate}
                className="text-xs px-1.5 py-0.5 rounded transition-colors"
                style={{ 
                  color: colors.speedButton,
                  backgroundColor: colors.playButtonBg
                }}
                title="Velocidade de reprodução"
              >
                {playbackRate}x
              </button>
            )}
          </div>
        </div>

        {/* Botão de velocidade (sempre visível) */}
        <button
          onClick={changePlaybackRate}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200"
          style={{
            backgroundColor: colors.playButtonBg,
            color: colors.playButton
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.playButtonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.playButtonBg;
          }}
          title="Velocidade de reprodução"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};

