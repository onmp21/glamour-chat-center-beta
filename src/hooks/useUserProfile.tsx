
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: string;
  bio: string;
  profileImage: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { updateUser } = useUsers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getProfile = (): UserProfile | null => {
    if (!user) return null;

    const savedBio = localStorage.getItem(`userBio_${user.id}`) || '';
    const savedImage = localStorage.getItem(`userProfileImage_${user.id}`) || null;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      bio: savedBio,
      profileImage: savedImage
    };
  };

  const updateProfile = async (profileData: {
    name?: string;
    bio?: string;
    profileImage?: string | null;
  }) => {
    if (!user) return false;

    try {
      setLoading(true);

      // Atualizar nome no banco de dados se fornecido
      if (profileData.name && profileData.name !== user.name) {
        await updateUser(user.id, {
          name: profileData.name
        });
      }

      // Salvar biografia no localStorage
      if (profileData.bio !== undefined) {
        localStorage.setItem(`userBio_${user.id}`, profileData.bio);
      }

      // Salvar imagem de perfil no localStorage
      if (profileData.profileImage !== undefined) {
        if (profileData.profileImage) {
          localStorage.setItem(`userProfileImage_${user.id}`, profileData.profileImage);
        } else {
          localStorage.removeItem(`userProfileImage_${user.id}`);
        }
      }

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return {
    getProfile,
    updateProfile,
    convertImageToBase64,
    loading
  };
};
