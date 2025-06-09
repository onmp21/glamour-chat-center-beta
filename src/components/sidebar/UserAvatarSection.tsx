
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { User, Upload, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useToast } from '@/hooks/use-toast';

interface UserAvatarSectionProps {
  isDarkMode: boolean;
  userName: string;
}

export const UserAvatarSection: React.FC<UserAvatarSectionProps> = ({
  isDarkMode,
  userName
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const { user } = useAuth();
  const { getProfileByUserId, updateProfile, loading } = useUserProfiles();
  const { toast } = useToast();

  const userProfile = user ? getProfileByUserId(user.id) : null;

  const handleAvatarUpdate = async () => {
    if (!avatarUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL válida para o avatar",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateProfile({ avatar_url: avatarUrl.trim() });
      setIsDialogOpen(false);
      setAvatarUrl('');
      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar avatar",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar_url: null });
      setIsDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Avatar removido com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover avatar",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center space-x-3">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage 
                src={userProfile?.avatar_url || undefined} 
                alt={userName}
              />
              <AvatarFallback className={cn(
                "text-xs font-medium",
                isDarkMode 
                  ? "bg-zinc-700 text-zinc-300" 
                  : "bg-gray-200 text-gray-700"
              )}>
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                isDarkMode ? "text-zinc-100" : "text-gray-900"
              )}>
                {userName}
              </p>
              <p className={cn(
                "text-xs truncate",
                isDarkMode ? "text-zinc-400" : "text-gray-500"
              )}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </button>
        </DialogTrigger>
        
        <DialogContent className={cn(
          "max-w-md",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-zinc-100" : "text-gray-900"}>
              Atualizar Avatar
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={userProfile?.avatar_url || undefined} 
                  alt={userName}
                />
                <AvatarFallback className={cn(
                  "text-lg font-medium",
                  isDarkMode 
                    ? "bg-zinc-700 text-zinc-300" 
                    : "bg-gray-200 text-gray-700"
                )}>
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar-url">URL do Avatar</Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/avatar.jpg"
                className={cn(
                  isDarkMode 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100" 
                    : "bg-white border-gray-300"
                )}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleAvatarUpdate} 
                className="flex-1"
                disabled={!avatarUrl.trim() || loading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              
              {userProfile?.avatar_url && (
                <Button 
                  onClick={handleRemoveAvatar} 
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
