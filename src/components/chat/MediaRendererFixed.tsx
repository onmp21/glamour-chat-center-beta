import React, { useState, useEffect } from 'react';
import { MediaProcessor } from '@/services/MediaProcessor';
import { AudioPlayerFixed } from './AudioPlayerFixed';
import { MediaOverlay } from './MediaOverlay';
import { AlertCircle, Download, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaResult {
  isProcessed: boolean;
  url?: string;
  type?: string;
  mimeType?: string;
  size?: string;
  error?: string;
}

interface MediaRendererFixedProps {
  content: string;
  messageType?: string;
  messageId: string;
  isDarkMode?: boolean;
  fileName?: string;
  balloonColor?: 'sent' | 'received'; // Nova prop para determinar a cor do balão
}

export const MediaRendererFixed: React.FC<MediaRendererFixedProps> = ({
  content,
  messageType,
  messageId,
  isDarkMode = false,
  fileName,
  balloonColor = 'received'
}) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [processedResult, setProcessedResult] = useState<MediaResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    MediaProcessor.processAsync(content, messageType).then(res => {
      if (mounted) {
        setProcessedResult(res);
        setLoading(false);
      }
    });
    return () => { mounted = false };
  }, [content, messageType]);

  // Estado de erro
  const renderError = () => (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[80px] p-4 rounded-lg border max-w-[300px]",
      isDarkMode ? "bg-destructive/20 border-destructive/50" : "bg-red-50 border-red-200"
    )}>
      <AlertCircle className="text-destructive mb-2" size={24} />
      <div className={cn(
        "text-sm font-medium text-center",
        isDarkMode ? "text-destructive-foreground" : "text-red-600"
      )}>
        Erro ao carregar mídia
      </div>
      <div className={cn(
        "text-xs text-center mt-1",
        isDarkMode ? "text-destructive-foreground/80" : "text-red-500"
      )}>
        {(processedResult && processedResult.error) || 'Formato não suportado'}
      </div>
    </div>
  );

  if (loading || !processedResult) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[80px] p-4 rounded-lg border max-w-[300px]",
        isDarkMode ? "bg-muted border-border" : "bg-gray-100 border-gray-200"
      )}>
        <div className="animate-spin w-6 h-6 rounded-full border-4 border-primary border-t-transparent" />
        <div className="mt-2 text-xs text-muted-foreground">Carregando mídia…</div>
      </div>
    );
  }

  if (!processedResult.isProcessed || !processedResult.url) {
    return renderError();
  }

  const { url, mimeType, type, size } = processedResult;

  // Exibir apenas se URL está no storage público.
  const isBucketUrl = url && url.startsWith('https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/');
  if (!isBucketUrl) return renderError();

  // Renderizar áudio
  if (type === 'audio') {
    return (
      <div className="max-w-[300px]">
        <AudioPlayerFixed
          audioContent={content}
          isDarkMode={isDarkMode}
          messageId={messageId}
          balloonColor={balloonColor} // Usar a prop balloonColor
        />
      </div>
    );
  }

  // Renderizar imagem
  if (type === 'image') {
    return (
      <>
        <div className="relative max-w-[300px]">
          <img 
            src={url} 
            alt="Imagem enviada" 
            className="chat-message-media cursor-pointer max-w-full max-h-[400px] object-contain rounded-lg"
            onClick={() => setIsOverlayOpen(true)}
            onError={(e) => {
              console.error('❌ [IMAGE] Erro ao carregar:', messageId, e);
            }}
            onLoad={() => {
              console.log('✅ [IMAGE] Carregada:', messageId);
            }}
          />
          {size && (
            <div className={cn(
              "absolute bottom-2 right-2 px-2 py-1 rounded text-xs",
              "bg-background/50 text-foreground backdrop-blur-sm"
            )}>
              {size}
            </div>
          )}
        </div>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={url}
          mediaType="image"
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Renderizar sticker
  if (type === 'sticker') {
    return (
      <div className="relative max-w-[200px]">
        <img 
          src={url} 
          alt="Sticker" 
          className="chat-message-media cursor-pointer max-w-full max-h-[200px] object-contain"
          onClick={() => setIsOverlayOpen(true)}
          onError={(e) => {
            console.error('❌ [STICKER] Erro ao carregar:', messageId, e);
          }}
          onLoad={() => {
            console.log('✅ [STICKER] Carregado:', messageId);
          }}
        />
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={url}
          mediaType="image"
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  // Renderizar vídeo
  if (type === 'video') {
    return (
      <>
        <div className="relative max-w-[300px]">
          <video 
            controls 
            preload="metadata"
            className="chat-message-media max-w-full max-h-[400px] rounded-lg"
            onError={(e) => {
              console.error('❌ [VIDEO] Erro ao carregar:', messageId, e);
            }}
            onLoadedMetadata={() => {
              console.log('✅ [VIDEO] Metadata carregada:', messageId);
            }}
          >
            <source src={url} type={mimeType} />
            Seu navegador não suporta vídeo.
          </video>
          
          {size && (
            <div className={cn(
              "absolute bottom-2 right-2 px-2 py-1 rounded text-xs",
              "bg-background/50 text-foreground backdrop-blur-sm"
            )}>
              {size}
            </div>
          )}
        </div>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={url}
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
      onClick={() => window.open(url, '_blank')}
    >
      <div className="text-2xl mr-3">
        {MediaProcessor.getMediaIcon((type as "document" | "text" | "audio" | "image" | "video" | "sticker") || 'document')}
      </div>
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
          {size || 'Clique para abrir'}
        </div>
        {mimeType && (
          <div className={cn(
            "text-xs mt-1",
            isDarkMode ? "text-muted-foreground/80" : "text-gray-400"
          )}>
            {mimeType}
          </div>
        )}
      </div>
      <Download size={16} className="text-muted-foreground" />
    </div>
  );
};
