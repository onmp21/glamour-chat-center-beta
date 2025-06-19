import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Download, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MediaPlayerProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  fileName?: string;
  isDarkMode: boolean;
  onClose?: () => void;
  className?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  mediaUrl,
  mediaType,
  fileName,
  isDarkMode,
  onClose,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName || `media-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlayPause = (audioElement: HTMLAudioElement | HTMLVideoElement) => {
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = (audioElement: HTMLAudioElement | HTMLVideoElement) => {
    audioElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const renderImagePlayer = () => (
    <div className={cn("relative group", className)}>
      <img
        src={mediaUrl}
        alt={fileName || "Imagem"}
        className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer"
        onClick={() => setShowOverlay(true)}
      />
      
      {/* Overlay para preview em tela cheia */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={mediaUrl}
              alt={fileName || "Imagem"}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOverlay(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="absolute top-4 left-4 text-white hover:bg-white/20"
            >
              <Download size={24} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderVideoPlayer = () => (
    <div className={cn("relative group", className)}>
      <video
        src={mediaUrl}
        className="max-w-full max-h-64 rounded-lg cursor-pointer"
        controls
        onClick={() => setShowOverlay(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Overlay para preview em tela cheia */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <video
              src={mediaUrl}
              className="max-w-full max-h-full"
              controls
              autoPlay
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOverlay(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="absolute top-4 left-4 text-white hover:bg-white/20"
            >
              <Download size={24} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAudioPlayer = () => (
    <div className={cn(
      "w-full p-4 rounded-lg border",
      isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isDarkMode ? "bg-[#3f3f46]" : "bg-gray-200"
        )}>
          <Volume2 size={20} className={isDarkMode ? "text-gray-300" : "text-gray-600"} />
        </div>
        
        <div className="flex-1">
          <p className={cn(
            "text-sm font-medium",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {fileName || "Áudio"}
          </p>
          <audio
            src={mediaUrl}
            className="w-full mt-2"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className={cn(
            "h-8 w-8",
            isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  );

  switch (mediaType) {
    case 'image':
      return renderImagePlayer();
    case 'video':
      return renderVideoPlayer();
    case 'audio':
      return renderAudioPlayer();
    default:
      return null;
  }
};

