
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Send, FileText, Image, Music, Video, Play, Pause } from 'lucide-react';
import { FileData } from '@/types/messageTypes';

interface FilePreviewModalProps {
  fileData: FileData;
  isDarkMode?: boolean;
  onSend: (caption?: string) => Promise<void>;
  onCancel: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileData,
  isDarkMode,
  onSend,
  onCancel
}) => {
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (sending) return;
    
    setSending(true);
    try {
      console.log('📤 [FILE_PREVIEW] Enviando arquivo:', fileData.fileName);
      await onSend(caption.trim() || undefined);
      console.log('✅ [FILE_PREVIEW] Arquivo enviado com sucesso');
    } catch (error) {
      console.error('❌ [FILE_PREVIEW] Erro ao enviar arquivo:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={24} />;
    if (mimeType.startsWith('audio/')) return <Music size={24} />;
    if (mimeType.startsWith('video/')) return <Video size={24} />;
    return <FileText size={24} />;
  };

  const isImage = fileData.mimeType.startsWith('image/');
  const isVideo = fileData.mimeType.startsWith('video/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn(
        "rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto",
        isDarkMode ? "bg-zinc-900 text-white" : "bg-white"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Enviar Arquivo</h3>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={sending}>
            <X size={20} />
          </Button>
        </div>

        <div className="mb-4">
          {isImage ? (
            <img
              src={fileData.base64}
              alt={fileData.fileName}
              className="w-full max-h-64 object-contain rounded"
            />
          ) : isVideo ? (
            <video
              src={fileData.base64}
              controls
              className="w-full max-h-64 rounded"
            />
          ) : (
            <div className={cn(
              "flex items-center gap-3 p-4 rounded border",
              isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"
            )}>
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded",
                isDarkMode ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600"
              )}>
                {getFileIcon(fileData.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileData.fileName}</p>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-zinc-400" : "text-gray-500"
                )}>
                  {fileData.mimeType}
                </p>
                <p className={cn(
                  "text-xs",
                  isDarkMode ? "text-zinc-500" : "text-gray-400"
                )}>
                  {(fileData.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        <textarea
          placeholder="Adicionar uma legenda (opcional)... Pressione Ctrl+Enter para enviar"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          onKeyPress={handleKeyPress}
          className={cn(
            "w-full mb-4 p-3 rounded border resize-none",
            isDarkMode 
              ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400" 
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          )}
          rows={3}
          disabled={sending}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={sending}
            className={isDarkMode ? "border-zinc-700 text-white hover:bg-zinc-800" : ""}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-[#b5103c] hover:bg-[#a00f36] text-white"
          >
            {sending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </div>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
