
import React, { useState, useEffect } from 'react';
import { MediaProcessor } from '@/services/MediaProcessor';
import { AudioPlayerFixed } from './AudioPlayerFixed';
import { MediaOverlay } from './MediaOverlay';
import { AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaMigrationService } from '@/services/MediaMigrationService';
import { getTableNameForChannel } from '@/utils/channelMapping';

interface MediaRendererProps {
  content: string;
  messageType?: string;
  messageId: string;
  channelId: string;
  isDarkMode?: boolean;
  fileName?: string;
  balloonColor?: 'sent' | 'received';
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  content,
  messageType,
  messageId,
  channelId,
  isDarkMode = false,
  fileName,
  balloonColor = 'received'
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    const processMedia = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Se já é URL do storage, usar diretamente
        if (MediaMigrationService.isStorageUrl(content)) {
          setMediaUrl(content);
          setIsLoading(false);
          return;
        }

        // Se é base64, migrar automaticamente
        if (MediaMigrationService.isBase64Content(content) || content.startsWith('data:')) {
          const tableName = getTableNameForChannel(channelId);
          
          // Iniciar migração em background
          MediaMigrationService.migrateMessageMedia(tableName, messageId, content)
            .then(result => {
              if (result.success && result.storageUrl) {
                setMediaUrl(result.storageUrl);
              } else {
                // Fallback para processar base64 localmente
                const processed = MediaProcessor.process(content, messageType);
                if (processed.isProcessed && processed.url) {
                  setMediaUrl(processed.url);
                } else {
                  setError('Falha ao processar mídia');
                }
              }
            })
            .catch(() => {
              // Fallback para processar base64 localmente
              const processed = MediaProcessor.process(content, messageType);
              if (processed.isProcessed && processed.url) {
                setMediaUrl(processed.url);
              } else {
                setError('Falha ao processar mídia');
              }
            });

          // Processar localmente para exibição imediata
          const processed = MediaProcessor.process(content, messageType);
          if (processed.isProcessed && processed.url) {
            setMediaUrl(processed.url);
          }
        } else {
          // Não é mídia válida
          setError('Conteúdo não é uma mídia válida');
        }
      } catch (err) {
        console.error('❌ [MEDIA_RENDERER] Error processing media:', err);
        setError('Erro ao processar mídia');
      } finally {
        setIsLoading(false);
      }
    };

    processMedia();
  }, [content, messageType, messageId, channelId]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-3 rounded-lg border max-w-[200px]">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        <span className="text-xs">Carregando mídia...</span>
      </div>
    );
  }

  if (error || !mediaUrl) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[80px] p-4 rounded-lg border max-w-[300px]",
        isDarkMode ? "bg-destructive/20 border-destructive/50" : "bg-red-50 border-red-200"
      )}>
        <AlertCircle className="text-destructive mb-2" size={24} />
        <div className={cn(
          "text-sm font-medium text-center",
          isDarkMode ? "text-destructive-foreground" : "text-red-600"
        )}>
          Mídia não disponível
        </div>
        <div className={cn(
          "text-xs text-center mt-1",
          isDarkMode ? "text-destructive-foreground/80" : "text-red-500"
        )}>
          {error || 'Formato não suportado'}
        </div>
      </div>
    );
  }

  const mediaType = MediaProcessor.detectMediaType(content, messageType);

  // Renderizar áudio
  if (mediaType === 'audio') {
    return (
      <div className="max-w-[300px]">
        <AudioPlayerFixed
          audioContent={mediaUrl}
          isDarkMode={isDarkMode}
          messageId={messageId}
          balloonColor={balloonColor}
        />
      </div>
    );
  }

  // Renderizar imagem
  if (mediaType === 'image') {
    return (
      <>
        <div className="relative max-w-[300px]">
          <img 
            src={mediaUrl} 
            alt="Imagem enviada" 
            className="chat-message-media cursor-pointer max-w-full max-h-[400px] object-contain rounded-lg"
            onClick={() => setIsOverlayOpen(true)}
            onError={() => setError('Erro ao carregar imagem')}
          />
        </div>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={mediaUrl}
          mediaType="image"
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Renderizar vídeo
  if (mediaType === 'video') {
    return (
      <>
        <div className="relative max-w-[300px]">
          <video 
            controls 
            preload="metadata"
            className="chat-message-media max-w-full max-h-[400px] rounded-lg"
            onError={() => setError('Erro ao carregar vídeo')}
          >
            <source src={mediaUrl} />
            Seu navegador não suporta vídeo.
          </video>
        </div>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={mediaUrl}
          mediaType="video"
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Documentos e outros tipos
  return (
    <div 
      className={cn(
        "flex items-center p-3 rounded-lg border cursor-pointer max-w-[300px] transition-colors",
        isDarkMode ? "bg-card hover:bg-card/80 border-border" : "bg-gray-100 hover:bg-gray-200 border-gray-300"
      )}
      onClick={() => window.open(mediaUrl, '_blank')}
    >
      <div className="text-2xl mr-3">📄</div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm truncate",
          isDarkMode ? "text-foreground" : "text-gray-900"
        )}>
          {fileName || 'Documento'}
        </div>
        <div className={cn(
          "text-xs",
          isDarkMode ? "text-muted-foreground" : "text-gray-500"
        )}>
          Clique para abrir
        </div>
      </div>
      <Download size={16} className="text-muted-foreground" />
    </div>
  );
};
