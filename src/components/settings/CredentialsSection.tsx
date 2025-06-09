
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
import { Lock, User, Camera } from 'lucide-react';
import { ProfilePictureUpload } from './ProfilePictureUpload';

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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar foto de perfil existente
  useEffect(() => {
    if (user?.id) {
      const savedImage = localStorage.getItem(`userProfileImage_${user.id}`);
      setProfileImage(savedImage);
    }
  }, [user?.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileImageChange = (imageData: string | null) => {
    setProfileImage(imageData);
    
    if (user?.id) {
      if (imageData) {
        localStorage.setItem(`userProfileImage_${user.id}`, imageData);
      } else {
        localStorage.removeItem(`userProfileImage_${user.id}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validações
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
      
      if (formData.username !== user.username) {
        updateData.username = formData.username;
        changes.push('username');
      }
      
      if (formData.newPassword.trim()) {
        updateData.password = formData.newPassword;
        changes.push('password');
      }

      // Só atualizar no banco se houver mudanças de username ou senha
      if (Object.keys(updateData).length > 0) {
        await updateUser(user.id, updateData);
      }

      // A foto de perfil já foi salva no localStorage via handleProfileImageChange
      if (profileImage !== null) {
        changes.push('profile_picture');
      }
      
      // Log da ação se houve mudanças
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

      // Limpar senhas após sucesso
      setFormData(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error) {
      console.error('Erro ao atualizar credenciais:', error);
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
    <div className={cn(
      "p-6 space-y-6",
      isDarkMode ? "bg-background" : "bg-gray-50"
    )}>
      <div className="max-w-2xl mx-auto">
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
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePictureUpload
              currentImage={profileImage}
              onImageChange={handleProfileImageChange}
              isDarkMode={isDarkMode}
            />
          </CardContent>
        </Card>

        {/* Seção de Credenciais */}
        <Card className={cn(
          "border",
          isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              "flex items-center gap-3 text-lg",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
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
      </div>
    </div>
  );
};
