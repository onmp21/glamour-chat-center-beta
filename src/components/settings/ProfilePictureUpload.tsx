import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Upload } from 'lucide-react';
import { useSupabaseAvatar } from "@/hooks/useSupabaseAvatar";

interface ProfilePictureUploadProps {
  currentImage: string | null;
  onImageChange: (imageData: string | null) => void;
  isDarkMode: boolean;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImage,
  onImageChange,
  isDarkMode
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    uploadAvatar,
    removeAvatar: removeAvatarFromDb,
    loading: supabaseUploading,
  } = useSupabaseAvatar();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload no Supabase bucket avatars
      const publicUrl = await uploadAvatar(file);
      if (publicUrl) {
        setPreviewImage(publicUrl);
        onImageChange(publicUrl);

        toast({
          title: "Sucesso",
          description: "Foto de perfil atualizada!",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao fazer upload no Supabase",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async () => {
    setPreviewImage(null);
    onImageChange(null);
    await removeAvatarFromDb();
    toast({
      title: "Sucesso",
      description: "Foto de perfil removida",
      variant: "default",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Preview da imagem */}
        <div className={cn(
          "relative w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden",
          isDarkMode ? "border-border bg-muted" : "border-gray-300 bg-gray-50"
        )}>
          {previewImage ? (
            <>
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-sm"
                title="Remover foto"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <Camera size={24} className={cn(
              isDarkMode ? "text-muted-foreground" : "text-gray-400"
            )} />
          )}
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={supabaseUploading || uploading}
            className={cn(
              "flex items-center gap-2 h-9",
              isDarkMode ? "border-input hover:bg-accent" : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Upload size={16} />
            {uploading ? 'Enviando...' : previewImage ? 'Alterar Foto' : 'Enviar Foto'}
          </Button>
          
          {previewImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-9"
            >
              Remover
            </Button>
          )}
        </div>
        
        {/* Input file escondido */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      <p className={cn(
        "text-xs",
        isDarkMode ? "text-muted-foreground" : "text-gray-500"
      )}>
        Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
      </p>
    </div>
  );
};
