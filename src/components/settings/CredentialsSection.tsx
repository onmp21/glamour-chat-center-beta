
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { ProfilePicture } from '@/components/ProfilePicture';
import { useSupabaseAvatar } from "@/hooks/useSupabaseAvatar";

interface CredentialsSectionProps {
  isDarkMode: boolean;
}

export const CredentialsSection: React.FC<CredentialsSectionProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const { updateUser } = useUsers();
  const { logCredentialsAction } = useAuditLogger();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: user?.username || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State para draft/avatar preview
  const [avatarDraftFile, setAvatarDraftFile] = useState<File | null>(null);
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    getAvatarUrl,
    uploadAvatar,
    removeAvatar,
    updateAvatarUrl,
    loading: avatarLoading,
  } = useSupabaseAvatar();

  // Carrega avatar salvo do Supabase ao iniciar
  useEffect(() => {
    if (user?.id) {
      getAvatarUrl().then((url) => {
        setAvatarSaved(url || null);
        setAvatarDraftFile(null);
        setAvatarDraftUrl(null);
      });
    }
  }, [user?.id, getAvatarUrl]);

  // Handler para alterações draft/crop via componente ProfilePicture
  const handleAvatarChange = (file: File | null, previewUrl: string | null) => {
    setAvatarDraftFile(file);
    setAvatarDraftUrl(previewUrl);
    // Não faz upload agora, só ao salvar!
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e confirmação não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {};
      const changes: string[] = [];
      // Avatar
      if (avatarDraftFile && avatarDraftUrl) {
        // Faz upload agora
        const publicUrl = await uploadAvatar(avatarDraftFile);
        if (publicUrl) {
          await updateAvatarUrl(publicUrl);
          setAvatarSaved(publicUrl);
          changes.push('profile_picture');
        } else {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload da foto de perfil",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      } else if (!avatarDraftUrl && avatarSaved) {
        // Usuário removeu a foto e havia uma antiga salva
        await removeAvatar();
        setAvatarSaved(null);
        changes.push('profile_picture');
      }
      // Username/senha
      if (formData.username !== user.username) {
        updateData.username = formData.username;
        changes.push('username');
      }
      if (formData.newPassword.trim()) {
        updateData.password = formData.newPassword;
        changes.push('password');
      }
      if (Object.keys(updateData).length > 0) {
        await updateUser(user.id, updateData);
      }
      if (changes.length > 0) {
        await logCredentialsAction('update', {
          changes,
          timestamp: new Date().toISOString()
        });
      }
      toast({
        title: "Sucesso",
        description: "Credenciais atualizadas com sucesso!",
        variant: "default"
      });
      setFormData(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setAvatarDraftFile(null);
      setAvatarDraftUrl(null);
      // Garante que reload de preview mostra foto salva, caso tenha mudado
      if (user?.id) {
        const novaUrl = await getAvatarUrl();
        setAvatarSaved(novaUrl || null);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar credenciais. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Seção de Foto de Perfil */}
      <Card className={cn(
        "border mb-6",
        isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className={cn(
            "flex items-center gap-3 text-lg",
            isDarkMode ? "text-card-foreground" : "text-gray-900"
          )}>
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilePicture
            isDarkMode={isDarkMode}
            userName={user?.name || user?.username || ''}
            onAvatarChange={handleAvatarChange}
            externalPreview={avatarDraftUrl !== null ? avatarDraftUrl : avatarSaved}
          />
        </CardContent>
      </Card>

      {/* Seção de Credenciais */}
      <Card className={cn(
        "border shadow-sm",
        isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className={cn(
            "flex items-center gap-3 text-xl font-semibold",
            isDarkMode ? "text-card-foreground" : "text-gray-900"
          )}>
            <Lock className="h-5 w-5 text-primary" />
            Informações de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-card-foreground" : "text-gray-700"
              )}>
                Nome de Usuário <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="username" 
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={cn(
                  "h-11",
                  isDarkMode 
                    ? "bg-background border-input text-foreground" 
                    : "bg-white border-gray-300 text-gray-900"
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-card-foreground" : "text-gray-700"
              )}>
                Nova Senha
              </Label>
              <Input 
                id="new-password" 
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={cn(
                  "h-11",
                  isDarkMode 
                    ? "bg-background border-input text-foreground" 
                    : "bg-white border-gray-300 text-gray-900"
                )}
                placeholder="Deixe em branco para manter a atual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-card-foreground" : "text-gray-700"
              )}>
                Confirmar Nova Senha
              </Label>
              <Input 
                id="confirm-password" 
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={cn(
                  "h-11",
                  isDarkMode 
                    ? "bg-background border-input text-foreground" 
                    : "bg-white border-gray-300 text-gray-900"
                )}
                placeholder="Confirme a nova senha"
              />
            </div>
            <div className="pt-4">
              <Button 
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
