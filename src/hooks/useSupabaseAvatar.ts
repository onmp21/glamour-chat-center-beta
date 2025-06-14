
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Exporta tudo relacionado ao avatar do usuário no Supabase Storage/banco.
export function useSupabaseAvatar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Pega o avatar_url do perfil
  const getAvatarUrl = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("user_profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    if (error) return null;
    return data?.avatar_url || null;
  }, [user]);

  // Atualiza o avatar_url (quando faz upload)
  const updateAvatarUrl = useCallback(async (avatarUrl: string | null) => {
    if (!user) return;
    await supabase
      .from("user_profiles")
      .upsert(
        { id: user.id, avatar_url: avatarUrl || null, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
  }, [user]);

  // Realiza o upload pro bucket avatars e retorna a URL pública
  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase
        .storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get publicly accessible url
      const { data: urlData } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl || null;
      if (publicUrl) {
        await updateAvatarUrl(publicUrl);
        return publicUrl;
      }
      return null;
    } catch (e) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Remove a foto do perfil
  const removeAvatar = async () => {
    await updateAvatarUrl(null);
  };

  return {
    getAvatarUrl,
    updateAvatarUrl,
    uploadAvatar,
    removeAvatar,
    loading,
  };
}
