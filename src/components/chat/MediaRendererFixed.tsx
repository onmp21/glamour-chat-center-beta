
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaRendererFixedProps {
  content: string;
  messageType?: string;
  messageId?: string;
  isDarkMode?: boolean;
  fileName?: string;
}

export const MediaRendererFixed: React.FC<MediaRendererFixedProps> = ({
  content,
  messageType,
  messageId,
  isDarkMode = false,
  fileName
}) => {
  const [mediaError, setMediaError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  useEffect(() => {
    console.log('🎯 [MEDIA_RENDERER_FIXED] Processing content:', {
      messageId,
      messageType,
      contentLength: content?.length || 0,
      isStorageUrl: content?.includes('supabase.co/storage'),
      isDataUrl: content?.startsWith('data:'),
      isHttpUrl: content?.startsWith('http')
    });

    setIsLoading(true);
    setMediaError(false);

    // PRIORIDADE ÚNICA: URL do Supabase Storage ou HTTP URLs
    if (content && (content.startsWith('http') || content.includes('supabase.co/storage'))) {
      console.log('✅ [MEDIA_RENDERER_FIXED] Using Storage/HTTP URL directly');
      setMediaUrl(content);
      setIsLoading(false);
      return;
    }

    // Se não é URL válida, considerar erro
    console.log('⚠️ [MEDIA_RENDERER_FIXED] Content not recognized as valid media URL');
    setMediaError(true);
    setIsLoading(false);
  }, [content, messageType, messageId]);

  const getMediaType = () => {
    if (messageType) return messageType.toLowerCase();
    
    // Auto-detectar baseado na URL
    if (mediaUrl.includes('image') || mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i)) return 'image';
    if (mediaUrl.includes('audio') || mediaUrl.match(/\.(mp3|ogg|wav|m4a)($|\?)/i)) return 'audio';
    if (mediaUrl.includes('video') || mediaUrl.match(/\.(mp4|avi|mov|wmv)($|\?)/i)) return 'video';
    if (mediaUrl.includes('document') || mediaUrl.match(/\.(pdf|doc|docx|txt)($|\?)/i)) return 'document';
    
    return 'file';
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName || `media_${messageId || Date.now()}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ [MEDIA_RENDERER_FIXED] Download error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-4 rounded-lg border-2 border-dashed",
        isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"
      )}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-500">Carregando mídia...</span>
      </div>
    );
  }

  if (mediaError || !mediaUrl) {
    return (
      <div className={cn(
        "flex items-center p-3 rounded-lg border",
        isDarkMode ? "border-red-700 bg-red-900/20" : "border-red-200 bg-red-50"
      )}>
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        <span className="text-sm text-red-600">URL de mídia inválida ou não encontrada</span>
      </div>
    );
  }

  const mediaType = getMediaType();

  // Renderizar baseado no tipo de mídia
  switch (mediaType) {
    case 'image':
      return (
        <div className="relative group">
          <img
            src={mediaUrl}
            alt="Imagem"
            className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onError={() => setMediaError(true)}
            onClick={() => window.open(mediaUrl, '_blank')}
            loading="lazy"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'audio':
      return (
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg border",
          isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"
        )}>
          <div className="flex-1">
            <audio controls className="w-full">
              <source src={mediaUrl} />
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'video':
      return (
        <div className="relative group">
          <video
            controls
            className="max-w-xs max-h-64 rounded-lg"
            preload="metadata"
          >
            <source src={mediaUrl} />
            Seu navegador não suporta o elemento de vídeo.
          </video>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'document':
    case 'file':
    default:
      return (
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-opacity-80",
          isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"
        )} onClick={handleDownload}>
          <FileText className="h-5 w-5 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {fileName || 'Documento'}
            </p>
            <p className="text-xs text-gray-500">
              Clique para baixar
            </p>
          </div>
          <Download className="h-4 w-4 text-gray-400" />
        </div>
      );
  }
};
