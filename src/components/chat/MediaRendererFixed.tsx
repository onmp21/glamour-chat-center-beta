
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Download, FileText, Play, Volume2, Image as ImageIcon, AlertCircle } from 'lucide-react';
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
      isDataUrl: content?.startsWith('data:')
    });

    setIsLoading(true);
    setMediaError(false);

    // PRIORIDADE 1: URL do Supabase Storage (novo sistema)
    if (content && (content.startsWith('http') || content.includes('supabase.co/storage'))) {
      console.log('✅ [MEDIA_RENDERER_FIXED] Using Storage URL directly');
      setMediaUrl(content);
      setIsLoading(false);
      return;
    }

    // PRIORIDADE 2: Data URL base64 (sistema antigo - compatibilidade)
    if (content && content.startsWith('data:')) {
      console.log('✅ [MEDIA_RENDERER_FIXED] Using Data URL (base64)');
      setMediaUrl(content);
      setIsLoading(false);
      return;
    }

    // PRIORIDADE 3: Base64 puro (precisa processar)
    if (content && content.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(content.replace(/\s/g, ''))) {
      console.log('🔄 [MEDIA_RENDERER_FIXED] Processing raw base64');
      try {
        // Detectar MIME type baseado no messageType ou conteúdo
        let mimeType = 'application/octet-stream';
        
        if (messageType) {
          switch (messageType.toLowerCase()) {
            case 'image': mimeType = 'image/jpeg'; break;
            case 'audio': mimeType = 'audio/mpeg'; break;
            case 'video': mimeType = 'video/mp4'; break;
            case 'document': 
            case 'file': mimeType = 'application/pdf'; break;
          }
        } else {
          // Auto-detectar baseado no início do base64
          if (content.startsWith('/9j/')) mimeType = 'image/jpeg';
          else if (content.startsWith('iVBORw')) mimeType = 'image/png';
          else if (content.startsWith('SUQz') || content.startsWith('//uQ')) mimeType = 'audio/mpeg';
          else if (content.startsWith('AAAAGG')) mimeType = 'video/mp4';
          else if (content.startsWith('JVBERi')) mimeType = 'application/pdf';
        }

        const dataUrl = `data:${mimeType};base64,${content}`;
        setMediaUrl(dataUrl);
        console.log('✅ [MEDIA_RENDERER_FIXED] Base64 processed successfully');
      } catch (error) {
        console.error('❌ [MEDIA_RENDERER_FIXED] Error processing base64:', error);
        setMediaError(true);
      }
      setIsLoading(false);
      return;
    }

    // Caso não seja mídia reconhecível
    console.log('⚠️ [MEDIA_RENDERER_FIXED] Content not recognized as media');
    setMediaError(true);
    setIsLoading(false);
  }, [content, messageType, messageId]);

  const getMediaType = () => {
    if (messageType) return messageType.toLowerCase();
    
    // Auto-detectar baseado na URL ou conteúdo
    if (mediaUrl.includes('image') || mediaUrl.includes('data:image') || 
        mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i)) return 'image';
    if (mediaUrl.includes('audio') || mediaUrl.includes('data:audio') || 
        mediaUrl.match(/\.(mp3|ogg|wav|m4a)($|\?)/i)) return 'audio';
    if (mediaUrl.includes('video') || mediaUrl.includes('data:video') || 
        mediaUrl.match(/\.(mp4|avi|mov|wmv)($|\?)/i)) return 'video';
    if (mediaUrl.includes('document') || mediaUrl.includes('application/pdf') || 
        mediaUrl.match(/\.(pdf|doc|docx|txt)($|\?)/i)) return 'document';
    
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
        <span className="text-sm text-red-600">Erro ao carregar mídia</span>
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
          <Volume2 className="h-5 w-5 text-blue-500" />
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
