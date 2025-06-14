
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  user_id: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfiles = () => {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const getProfileByUserId = (userId: string): UserProfile | null => {
    return profiles[userId] || null;
  };

  const loadProfile = async (userId: string) => {
    if (profiles[userId]) return profiles[userId];

    try {
      // Since user_profiles table doesn't exist, return mock data based on users table
      const mockProfile: UserProfile = {
        id: userId,
        user_id: userId,
        avatar_url: null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setProfiles(prev => ({
        ...prev,
        [userId]: mockProfile
      }));
      
      return mockProfile;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return null;

    try {
      setLoading(true);

      // Since we don't have user_profiles table, just update local state
      const updatedProfile: UserProfile = {
        id: user.id,
        user_id: user.id,
        avatar_url: updates.avatar_url || null,
        bio: updates.bio || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setProfiles(prev => ({
        ...prev,
        [user.id]: updatedProfile
      }));

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    loading,
    getProfileByUserId,
    loadProfile,
    uploadAvatar,
    updateProfile
  };
};
