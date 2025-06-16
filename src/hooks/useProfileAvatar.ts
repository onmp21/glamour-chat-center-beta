
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

function getFilePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
  return match ? match[1] : null;
}

export function useProfileAvatar() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const fetchAvatar = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data && data.avatar_url && data.avatar_url.startsWith('https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/avatars/')) {
      setAvatarUrl(data.avatar_url);
      setFilePath(getFilePathFromUrl(data.avatar_url));
    } else {
      setAvatarUrl(null);
      setFilePath(null);
    }
    setLoading(false);
    setReady(true);
  }, [user?.id]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  // Remove imagem antiga (se existir)
  const removeOldAvatar = async () => {
    if (filePath) {
      await supabase.storage.from("avatars").remove([filePath]);
    }
  };

  // Upload e atualização do avatar
  const uploadAvatar = async (file: File) => {
    if (!user) return null;
    setLoading(true);
    if (filePath) await removeOldAvatar();

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const { data, error: uploadError } = await supabase
      .storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setLoading(false);
      return null;
    }
    const { data: urlData } = supabase
      .storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl || null;

    if (publicUrl && publicUrl.startsWith('https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/avatars/')) {
      await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
      setAvatarUrl(publicUrl);
      setFilePath(getFilePathFromUrl(publicUrl));
    }
    setLoading(false);
    return publicUrl;
  };

  // Remover avatar
  const removeAvatar = async () => {
    setLoading(true);
    if (filePath) await removeOldAvatar();

    if (user?.id)
      await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

    setAvatarUrl(null);
    setFilePath(null);
    setLoading(false);
  };

  return {
    avatarUrl,
    uploadAvatar,
    removeAvatar,
    loading,
    ready,
    refetchAvatar: fetchAvatar,
  };
}
