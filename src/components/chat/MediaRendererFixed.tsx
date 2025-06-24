
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Download, FileText, Image, Volume2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidMediaUrl, getMediaTypeFromUrl, getMimeTypeFromUrl } from '@/utils/mediaUtils';

interface MediaRendererFixedProps {
  content: string;
  messageType?: string;
  messageId: string;
  isDarkMode?: boolean;
  fileName?: string;
  className?: string;
}

export const MediaRendererFixed: React.FC<MediaRendererFixedProps> = ({
  content,
  messageType = 'text',
  messageId,
  isDarkMode = false,
  fileName,
  className
}) => {
  const [loadError, setLoadError] = useState(false);

  console.log('🎨 [MEDIA_RENDERER_FIXED] Rendering:', {
    messageId,
    messageType,
    contentType: typeof content,
    contentLength: content?.length || 0,
    isValidUrl: isValidMediaUrl(content)
  });

  // Verificar se é uma URL de mídia válida
  if (!isValidMediaUrl(content)) {
    console.log('❌ [MEDIA_RENDERER_FIXED] Invalid media URL:', content);
    return (
      <div className={cn(
        "p-3 border rounded-lg text-center",
        isDarkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600"
      )}>
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Mídia indisponível</p>
      </div>
    );
  }

  const mediaType = getMediaTypeFromUrl(content);
  const mimeType = getMimeTypeFromUrl(content);

  // Função para download
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName || `media_${messageId}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ [MEDIA_RENDERER_FIXED] Download error:', error);
    }
  };

  // Renderizar baseado no tipo de mídia
  const renderMediaContent = () => {
    if (loadError) {
      return (
        <div className={cn(
          "p-4 border rounded-lg text-center",
          isDarkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600"
        )}>
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Erro ao carregar mídia</p>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      );
    }

    switch (mediaType) {
      case 'image':
        return (
          <div className="relative group">
            <img
              src={content}
              alt={fileName || 'Imagem'}
              className="max-w-full max-h-64 rounded-lg object-contain"
              onError={() => setLoadError(true)}
              loading="lazy"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={handleDownload}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="relative group">
            <video
              src={content}
              controls
              className="max-w-full max-h-64 rounded-lg"
              onError={() => setLoadError(true)}
              preload="metadata"
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={handleDownload}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className={cn(
            "p-3 border rounded-lg",
            isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-300"
          )}>
            <div className="flex items-center space-x-3">
              <Volume2 className="h-6 w-6 text-blue-500" />
              <div className="flex-1">
                <audio
                  src={content}
                  controls
                  className="w-full"
                  onError={() => setLoadError(true)}
                  preload="metadata"
                >
                  Seu navegador não suporta reprodução de áudio.
                </audio>
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className={cn(
            "p-4 border rounded-lg",
            isDarkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600"
          )}>
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">{fileName || 'Arquivo'}</p>
                <p className="text-sm opacity-70">{mimeType}</p>
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("media-renderer", className)}>
      {renderMediaContent()}
    </div>
  );
};
