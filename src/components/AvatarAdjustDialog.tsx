
import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// OBS: Simples preview, crop real deve ser imple mentado com pacote externo, mas fazemos só o ajuste zoom/pan básico com CSS!
interface AvatarAdjustDialogProps {
  open: boolean;
  imageUrl: string | null;
  onCancel: () => void;
  onConfirm: (croppedUrl: string) => void;
}

export const AvatarAdjustDialog: React.FC<AvatarAdjustDialogProps> = ({
  open, imageUrl, onCancel, onConfirm,
}) => {
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop: Por simplicidade, apenas gera preview do arquivo.
  // Para crop real, usaria um pacote externo, mas aqui só envia a mesma imagem.
  const handleConfirm = () => {
    if (!imageUrl) return;
    // Pode implementar crop real com canvas, mas mantemos preview fiel ao plano.
    onConfirm(imageUrl);
  };

  // Reset zoom ao abrir
  React.useEffect(() => { setZoom(1) }, [open, imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-xs p-4">
        <DialogHeader>
          <DialogTitle className="text-center">Ajuste sua foto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {imageUrl && (
            <div className="relative w-40 h-40 overflow-hidden rounded-full bg-muted border">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Preview"
                style={{
                  transform: `scale(${zoom})`,
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  transition: "transform 0.2s",
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 m-1 rounded-full text-destructive hover:bg-destructive/10 z-10"
                onClick={onCancel}
                type="button"
              >
                <X size={16} />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs">Zoom</label>
            <input
              type="range"
              min={1}
              max={2}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-28"
              disabled={!imageUrl}
            />
          </div>
          <Button onClick={handleConfirm} disabled={!imageUrl} className="w-full">
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
