
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Camera, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarAdjustDialog } from "./AvatarAdjustDialog";

interface ProfilePictureProps {
  isDarkMode: boolean;
  userName: string;
  onAvatarChange?: (avatarFile: File | null, previewUrl: string | null) => void;
  externalPreview?: string | null; // url vinda da ProfileSection: avatarDraftPreview || avatarSaved
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  isDarkMode,
  userName,
  onAvatarChange,
  externalPreview,
}) => {
  // previewImage: pode ser base64 novo OU url do avatar salvo
  const [previewImage, setPreviewImage] = useState<string | null>(null); // preview temporário (base64/crop) OU avatar salvo
  const [pendingFile, setPendingFile] = useState<File | null>(null); // File de upload (temporário, só para submit)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mostra sempre avatar do props, ou temporário se está cortando
  useEffect(() => {
    // Se for passada prop externalPreview, usar ela, senão limpa preview local
    if (externalPreview !== undefined) {
      setPreviewImage(externalPreview);
      setPendingFile(null);
    }
  }, [externalPreview]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Quando o usuário escolhe nova imagem, exibe crop
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      // NÃO salva nem envia NADA ainda! Só preview & abre crop.
      setPreviewImage(e.target?.result as string);
      setPendingFile(file);
      setAdjustDialogOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Limpa input para permitir novo upload
  };

  // Usuário cancela corte/seleção → limpa prévia local (não remove foto salva!)
  const handleRemovePreview = () => {
    setPreviewImage(null);
    setPendingFile(null);
    setAdjustDialogOpen(false);
    onAvatarChange?.(null, null); // Informa ao pai para limpar draft
  };

  // Após ajustar/cortar e confirmar:
  const handleConfirmPreview = (confirmedUrl: string) => {
    setPreviewImage(confirmedUrl);
    setAdjustDialogOpen(false);
    if (pendingFile && confirmedUrl) {
      // Passa arquivo temporário e base64 ajustado só pro pai (ProfileSection)
      onAvatarChange?.(pendingFile, confirmedUrl);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={previewImage || undefined} alt={userName} />
          <AvatarFallback className={cn(
            "text-2xl font-semibold",
            isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
          )}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <AvatarAdjustDialog
          open={adjustDialogOpen}
          imageUrl={previewImage}
          onCancel={handleRemovePreview}
          onConfirm={handleConfirmPreview}
        />
        <div className="absolute -bottom-2 -right-2">
          <label>
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              style={{ backgroundColor: '#b5103c' }}
              asChild
            >
              <div className="cursor-pointer">
                <Camera size={16} />
              </div>
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
      {(previewImage) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemovePreview}
          className="text-red-600 hover:text-red-700 mt-2"
          style={{
            backgroundColor: 'transparent',
            borderColor: '#dc2626',
            color: '#dc2626'
          }}
          type="button"
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
};
