import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface StickerMessageProps {
  stickerUrl: string;
  messageId: string;
  isDarkMode?: boolean;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export const StickerMessage: React.FC<StickerMessageProps> = ({
  stickerUrl,
  messageId,
  isDarkMode = false,
  onLoadStart,
  onLoadEnd,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    console.log('✅ [STICKER] Carregado:', messageId);
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ [STICKER] Erro ao carregar:', messageId, e);
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleLoadStart = () => {
    console.log('🔄 [STICKER] Iniciando carregamento:', messageId);
    setIsLoading(true);
    onLoadStart?.();
  };

  if (hasError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center w-32 h-32 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors",
        "sticker-error"
      )}
        onClick={() => {
          console.log('🔄 [STICKER] Tentando recarregar:', messageId);
          setHasError(false);
          setIsLoading(true);
        }}
      >
        <div className="text-2xl mb-2">🎭</div>
        <div className="text-xs font-medium text-red-600 dark:text-red-400">Erro ao carregar</div>
        <div className="text-xs text-red-500 dark:text-red-300 mt-1">Toque para tentar novamente</div>
      </div>
    );
  }

  return (
    <div className="sticker-container relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
      
      <img
        src={stickerUrl}
        alt="Sticker"
        className={cn(
          "w-32 h-32 object-contain rounded-lg transition-all duration-200 hover:scale-105",
          "sticker-image",
          isLoading && "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        loading="lazy"
      />
    </div>
  );
};

