import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, FileText, Image, Music, Video, Play, Pause } from 'lucide-react';
import { FileData } from '@/types/messageTypes';

interface FilePreviewModalProps {
  fileData: FileData;
  isDarkMode: boolean;
  onSend: (caption?: string) => void;
  onCancel: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileData,
  isDarkMode,
  onSend,
  onCancel
}) => {
  const [caption, setCaption] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const getFileIcon = () => {
    if (fileData.mimeType.startsWith('image/')) return <Image size={48} />;
    if (fileData.mimeType.startsWith('video/')) return <Video size={48} />;
    if (fileData.mimeType.startsWith('audio/')) return <Music size={48} />;
    return <FileText size={48} />;
  };

  const handleVideoToggle = (video: HTMLVideoElement) => {
    if (isVideoPlaying) {
      video.pause();
      setIsVideoPlaying(false);
    } else {
      video.play();
      setIsVideoPlaying(true);
    }
  };

  const getFilePreview = () => {
    if (fileData.mimeType.startsWith('image/')) {
      return (
        <div className="relative max-w-full max-h-80 flex justify-center">
          <img
            src={fileData.base64}
            alt="Preview"
            className="max-w-full max-h-80 object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }
    
    if (fileData.mimeType.startsWith('video/')) {
      return (
        <div className="relative max-w-full max-h-80 flex justify-center">
          <div className="relative">
            <video
              src={fileData.base64}
              className="max-w-full max-h-80 rounded-lg shadow-lg"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onClick={(e) => handleVideoToggle(e.currentTarget)}
            />
            
            {/* Overlay de controle de play/pause */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.currentTarget.parentElement?.parentElement?.querySelector('video');
                  if (video) handleVideoToggle(video);
                }}
                className="w-16 h-16 bg-black/50 text-white hover:bg-black/70 rounded-full"
              >
                {isVideoPlaying ? <Pause size={32} /> : <Play size={32} />}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (fileData.mimeType.startsWith('audio/')) {
      return (
        <div className="w-full max-w-md">
          <audio
            src={fileData.base64}
            className="w-full"
            controls
          />
        </div>
      );
    }

    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed max-w-md",
        isDarkMode ? "border-zinc-600 bg-zinc-800" : "border-gray-300 bg-gray-50"
      )}>
        <div className={cn(
          "mb-4",
          isDarkMode ? "text-zinc-400" : "text-gray-500"
        )}>
          {getFileIcon()}
        </div>
        <p className={cn(
          "text-sm font-medium text-center",
          isDarkMode ? "text-zinc-300" : "text-gray-700"
        )}>
          {fileData.fileName}
        </p>
        <p className={cn(
          "text-xs mt-1",
          isDarkMode ? "text-zinc-500" : "text-gray-500"
        )}>
          {(fileData.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className={cn(
        "w-full max-w-2xl mx-auto rounded-lg shadow-xl max-h-[90vh] overflow-hidden",
        isDarkMode ? "bg-[#212122]" : "bg-white"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-[#363537]" : "border-gray-200"
        )}>
          <h3 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Pré-visualização do Arquivo
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-400 hover:bg-[#272728]" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6 flex justify-center">
            {getFilePreview()}
          </div>

          {/* File Info */}
          <div className={cn(
            "mb-4 p-3 rounded-lg",
            isDarkMode ? "bg-[#272728]" : "bg-gray-50"
          )}>
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "font-medium",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Nome do arquivo:
              </span>
              <span className={cn(
                "font-mono",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {fileData.fileName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className={cn(
                "font-medium",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Tamanho:
              </span>
              <span className={cn(
                "font-mono",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {(fileData.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className={cn(
                "font-medium",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Tipo:
              </span>
              <span className={cn(
                "font-mono",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {fileData.mimeType}
              </span>
            </div>
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className={cn(
              "block text-sm font-medium mb-2",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Legenda (opcional)
            </label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda para acompanhar o arquivo..."
              className={cn(
                "resize-none",
                isDarkMode 
                  ? "bg-[#272728] border-[#363537] text-white placeholder:text-gray-500" 
                  : "bg-white border-gray-300"
              )}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          "flex justify-end gap-3 p-4 border-t",
          isDarkMode ? "border-[#363537]" : "border-gray-200"
        )}>
          <Button
            variant="outline"
            onClick={onCancel}
            className={cn(
              isDarkMode ? "border-[#363537] text-gray-300 hover:bg-[#272728]" : ""
            )}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onSend(caption.trim() || undefined)}
            className="bg-[#b5103c] hover:bg-[#a00f36] text-white gap-2"
          >
            <Send size={16} />
            Enviar Arquivo
          </Button>
        </div>
      </div>
    </div>
  );
};


