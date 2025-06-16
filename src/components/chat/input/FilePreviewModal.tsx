import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Send, FileText, Image, Music, Video, Play, Pause } from 'lucide-react';
import { FileData } from '@/types/messageTypes';

interface FilePreviewModalProps {
  fileData: any;
  isDarkMode?: boolean;
  onSend: (caption?: string) => void;
  onCancel: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileData,
  isDarkMode,
  onSend,
  onCancel
}) => {
  const [caption, setCaption] = useState("");

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", isDarkMode ? "bg-black/80" : "bg-black/40")}>
      <div className={cn("rounded-lg shadow-lg w-full max-w-md p-6", isDarkMode ? "bg-[#18181b] text-white" : "bg-white")}>
        <div className="mb-4">
          <div className="font-semibold text-base">Pré-visualização do arquivo</div>
        </div>
        <div className="mb-4">
          <div className="bg-gray-100 text-gray-700 rounded p-3">
            <span>{fileData?.name || "Arquivo"}</span>
            <div className="text-xs mt-1">{fileData?.mimeType}</div>
          </div>
        </div>
        <textarea
          placeholder="Adicionar uma legenda (opcional)..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className={cn("w-full mb-4 p-2 rounded border", isDarkMode ? "bg-[#18181b] border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900")}
          rows={2}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className={isDarkMode ? "border-[#b5103c] text-white" : "border-[#b5103c] text-[#b5103c]"}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          {/* Corrigir: garantir que chama corretamente a prop */}
          <Button
            className="bg-[#b5103c] text-white"
            onClick={() => onSend(caption)}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
};
