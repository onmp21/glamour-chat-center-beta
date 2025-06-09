
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isDarkMode?: boolean;
}

export const MediaOverlay: React.FC<MediaOverlayProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  isDarkMode = false
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="media-overlay animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="media-overlay-content">
        <button
          onClick={onClose}
          className="media-overlay-close"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Imagem ampliada"
            className="media-overlay-image"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="media-overlay-video"
            onClick={(e) => e.stopPropagation()}
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        )}
      </div>
    </div>
  );
};
