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
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center",
        "bg-black/90 backdrop-blur-sm animate-in fade-in-0 duration-300"
      )}
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 z-[100000] p-2 rounded-full",
            "bg-black/50 hover:bg-black/70 text-white transition-colors",
            "backdrop-blur-sm border border-white/20"
          )}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Imagem ampliada"
            className={cn(
              "max-w-full max-h-full object-contain rounded-lg",
              "shadow-2xl border border-white/10"
            )}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '90vw', 
              maxHeight: '90vh'
            }}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className={cn(
              "max-w-full max-h-full object-contain rounded-lg",
              "shadow-2xl border border-white/10"
            )}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '90vw', 
              maxHeight: '90vh'
            }}
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        )}
      </div>
    </div>
  );
};

