
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIResumoOverlayProps {
  open: boolean;
  onClose: () => void;
  summary?: string | null;
  isLoading: boolean;
  error?: string | null;
  isDarkMode?: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
}

export const AIResumoOverlay: React.FC<AIResumoOverlayProps> = ({
  open,
  onClose,
  summary,
  isLoading,
  error,
  isDarkMode,
  onCopy,
  onDownload
}) => {
  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    if (onCopy) onCopy();
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resumo-conversa.txt";
    link.click();
    if (onDownload) onDownload();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className={cn(
        "sm:max-w-lg p-0 overflow-hidden rounded-xl shadow-xl transition-all duration-300",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-[#b5103c]" />
            <DialogTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Resumo da Conversa
            </DialogTitle>
          </div>
          <button
            className={cn(
              "rounded-full p-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-700",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className={cn(
          "p-6 pb-4 max-h-[60vh] min-h-[120px] overflow-y-auto text-base transition-all",
          isDarkMode ? "text-gray-200" : "text-gray-800"
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-xl animate-pulse">Gerando resumo...</div>
          ) : error ? (
            <div className="text-red-500 font-semibold">{error}</div>
          ) : summary ? (
            <pre className="max-w-full whitespace-pre-wrap break-words">{summary}</pre>
          ) : (
            <div className="text-gray-400 italic">Resumo não disponível.</div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className={isDarkMode ? "text-white hover:bg-zinc-700" : "text-gray-900"}
            onClick={handleCopy}
            disabled={!summary}
          >
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!summary}
            className={isDarkMode ? "border-[#b5103c] text-white" : "border-[#b5103c] text-[#b5103c]"}
          >
            Baixar .txt
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="bg-[#b5103c] text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
