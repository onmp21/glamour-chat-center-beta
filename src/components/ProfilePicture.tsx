import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { AvatarAdjustDialog } from './AvatarAdjustDialog';

interface ProfilePictureProps {
  isDarkMode: boolean;
  userName: string;
  onAvatarChange?: (avatarFile: File | null, previewURL: string | null) => void;
  externalPreview?: string | null; // Para controlar preview externo
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  isDarkMode,
  userName,
  onAvatarChange,
  externalPreview,
}) => {
  const { user } = useAuth();
  const { loadProfile, loading } = useUserProfiles();
  const [savedImage, setSavedImage] = useState<string | null>(null); // No Supabase
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Novo upload, antes do save
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id).then(profile => {
        if (profile?.avatar_url) setSavedImage(profile.avatar_url);
        else setSavedImage(null);
      });
    }
  }, [user?.id, loadProfile]);

  // Mostra preview externo se veio da tela de perfil (preview do App)
  useEffect(() => {
    if (externalPreview !== undefined) setPreviewImage(externalPreview);
  }, [externalPreview]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Abre crop ao selecionar
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    // Mostra preview p/ crop/ajuste (não sobe ainda!)
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setPendingFile(file);
      setAdjustDialogOpen(true); // <-- aqui garante que vai abrir a overlay!
      onAvatarChange?.(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Limpa input
    event.target.value = '';
  };

  // Remove preview pendente (antes do upload)
  const handleRemovePreview = () => {
    setPreviewImage(null);
    setPendingFile(null);
    setAdjustDialogOpen(false);
    onAvatarChange?.(null, null);
  };

  // Após crop/confirmar
  const handleConfirmPreview = (confirmedUrl: string) => {
    setPreviewImage(confirmedUrl);
    setAdjustDialogOpen(false);
    // O arquivo em pendingFile já foi passado p/ app pela prop onAvatarChange
  };

  // Remove foto salva (do profile)
  // Exportado apenas para referência (a confirmação e save ocorre na tela de perfil, não aqui)

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={previewImage || savedImage || undefined} alt={userName} />
          <AvatarFallback className={cn(
            "text-2xl font-semibold",
            isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
          )}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {/* Overlay de ajuste */}
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
              disabled={loading}
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
              disabled={loading}
            />
          </label>
        </div>
      </div>

      {/* Mostrar botão para remover imagem atual */}
      {(previewImage || savedImage) && (
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
          disabled={loading}
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
};
