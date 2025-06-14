
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
  // Estado só para captura local
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null); // Arquivo temporário só para o pai no Save
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sempre que o draft externo muda (ProfileSection), ou avatar salvo, atualize o preview mostrado
  useEffect(() => {
    setPreviewImage(externalPreview ?? null);
    if (!externalPreview) {
      setPendingFile(null);
    }
  }, [externalPreview]);

  // Gera iniciais se não houver imagem
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
      setPreviewImage(e.target?.result as string);
      setPendingFile(file);
      setAdjustDialogOpen(true); // Abre ajuste/crop
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Limpa input, permitindo outro upload
  };

  // Usuário cancela crop: limpa apenas draft local, não afeta gravado no backend
  const handleRemovePreview = () => {
    setPreviewImage(null);
    setPendingFile(null);
    setAdjustDialogOpen(false);
    onAvatarChange?.(null, null); // Reseta draft no pai
  };

  // Ao confirmar o crop, envia pro pai só o arquivo temporário (não faz upload)
  const handleConfirmPreview = (confirmedUrl: string) => {
    setPreviewImage(confirmedUrl);
    setAdjustDialogOpen(false);
    if (pendingFile && confirmedUrl) {
      onAvatarChange?.(pendingFile, confirmedUrl); // Salva draft temporário
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
        {/* Dialog para crop/ajuste */}
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
