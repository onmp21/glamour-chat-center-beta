import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { ProfilePicture } from '../ProfilePicture';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface ProfileSectionProps {
  isDarkMode: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const { loadProfile, uploadAvatar, updateProfile, loading } = useUserProfiles();
  const { logProfileAction } = useAuditLogger();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  // Draft temporário
  const [avatarDraftFile, setAvatarDraftFile] = useState<File | null>(null); // File temporário (upload só no submit)
  const [avatarDraftPreview, setAvatarDraftPreview] = useState<string | null>(null); // base64 preview/crop
  // URL definitivo salvo no Supabase
  const [avatarSaved, setAvatarSaved] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile(user.id).then((profile) => {
        setFormData((prev) => ({
          ...prev,
          bio: profile?.bio || '',
        }));
        setAvatarSaved(profile?.avatar_url || null); // url que está no backend
        setAvatarDraftFile(null);
        setAvatarDraftPreview(null);
      });
    }
  }, [user, loadProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Recebe draft temporário do ProfilePicture
  const handleAvatarChange = (file: File | null, previewUrl: string | null) => {
    setAvatarDraftFile(file);
    setAvatarDraftPreview(previewUrl);
    // Importante: NÃO faz upload aqui!
  };

  // Limpa apenas o draft do avatar (preview temporário)
  const handleRemoveAvatar = () => {
    setAvatarDraftFile(null);
    setAvatarDraftPreview(null);
    // NÃO remove no Supabase ainda
  };

  // Submit do perfil: só aqui faz upload se há draft novo, e remove se não há
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let avatarUrlToSave = avatarSaved;

    // 1. Novo avatar escolhido mas diferente do salvo (draft temporário)
    if (avatarDraftFile && avatarDraftPreview && avatarDraftPreview !== avatarSaved) {
      // Faz upload na hora do submit
      const url = await uploadAvatar(avatarDraftFile);
      avatarUrlToSave = url;
      setAvatarSaved(url);
      setAvatarDraftFile(null);
      setAvatarDraftPreview(null);
    }
    // 2. Se o usuário removeu o draft e já tinha avatar salvo → remove também no Supabase
    else if (!avatarDraftFile && !avatarDraftPreview && avatarSaved) {
      avatarUrlToSave = null;
      setAvatarSaved(null);
      // Obs: Supabase removerá no updateProfile abaixo
    }

    await updateProfile({
      bio: formData.bio,
      avatar_url: avatarUrlToSave ?? null,
    });

    await logProfileAction('update', {
      timestamp: new Date().toISOString(),
      changes: ["bio", "avatar_url"]
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      manager_external: 'Gerente Externo',
      manager_store: 'Gerente de Loja',
      salesperson: 'Vendedora'
    };
    return labels[role] || role;
  };

  return (
    <Card className={cn(
      "border"
    )} style={{
      backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff',
      borderColor: isDarkMode ? '#686868' : '#e5e7eb'
    }}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center space-x-2",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          <User size={20} />
          <span>Perfil do Usuário</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex justify-center">
            <ProfilePicture
              isDarkMode={isDarkMode}
              userName={user?.name || ''}
              // Só passa o draft, nunca faz upload aqui!
              onAvatarChange={handleAvatarChange}
              externalPreview={avatarDraftPreview || avatarSaved}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className={cn(
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>Nome Completo</Label>
              <Input 
                id="fullName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                  borderColor: isDarkMode ? '#686868' : '#d1d5db',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className={cn(
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>Usuário</Label>
              <Input 
                id="username" 
                defaultValue={user?.username}
                disabled
                style={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6',
                  borderColor: isDarkMode ? '#686868' : '#d1d5db',
                  color: isDarkMode ? '#a1a1aa' : '#6b7280'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className={cn(
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>Cargo</Label>
              <Input 
                id="role" 
                defaultValue={getRoleLabel(user?.role || '')}
                disabled
                style={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6',
                  borderColor: isDarkMode ? '#686868' : '#d1d5db',
                  color: isDarkMode ? '#a1a1aa' : '#6b7280'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className={cn(
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>Biografia</Label>
              <Textarea 
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre você..."
                style={{
                  backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                  borderColor: isDarkMode ? '#686868' : '#d1d5db',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="hover:opacity-90"
            >
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
