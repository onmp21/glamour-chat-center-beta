import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useUserProfiles = () => {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const getProfileByUserId = useCallback((userId: string): UserProfile | null => {
    return profiles[userId] || null;
  }, [profiles]);

  // Carrega perfil real do Supabase pelo id
  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }

      if (data) {
        setProfiles(prev => ({ ...prev, [userId]: data }));
        return data as UserProfile;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload do avatar (usa bucket avatars)
  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return null;
    }
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      // 1. Upload arquivo no bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Recupera URL pública
      const { data: urlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do avatar",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Atualiza avatar_url e/ou bio no perfil
  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, "avatar_url" | "bio">>) => {
    if (!user?.id) return null;
    setLoading(true);
    try {
      // Build payload ensuring id is present and not optional
      const payload: { id: string; avatar_url?: string | null; bio?: string | null; updated_at: string } = {
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) throw error;

      setProfiles(prev => ({ ...prev, [user.id]: data as UserProfile }));
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Remove avatar no perfil
  const removeAvatar = useCallback(async () => {
    return await updateProfile({ avatar_url: null });
  }, [updateProfile]);

  // Atualiza bio
  const updateBio = useCallback(async (bio: string) => {
    return await updateProfile({ bio });
  }, [updateProfile]);

  // Carrega perfil do usuário autenticado (atalho)
  const loadCurrentUserProfile = useCallback(async () => {
    if (!user?.id) return null;
    return await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  return {
    profiles,
    loading,
    getProfileByUserId,
    loadProfile,
    loadCurrentUserProfile,
    uploadAvatar,
    updateProfile,
    updateBio,
    removeAvatar,
  };
};
