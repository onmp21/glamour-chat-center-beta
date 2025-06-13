import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePictureProps {
  isDarkMode: boolean;
  userName: string;
}

// Type guard to check if object has avatar_url property
const hasAvatarUrl = (obj: any): obj is { avatar_url?: string } => {
  return obj && typeof obj === 'object';
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  isDarkMode, 
  userName
}) => {
  const { user } = useAuth();
  const { getProfileByUserId, loadProfile, uploadAvatar, updateProfile, loading } = useUserProfiles();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile(user.id).then(profile => {
        if (hasAvatarUrl(profile) && profile.avatar_url) {
          setSelectedImage(profile.avatar_url);
        }
      });
    }
  }, [user, loadProfile]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    const avatarUrl = await uploadAvatar(file);
    if (avatarUrl) {
      setSelectedImage(avatarUrl);
      await updateProfile({ avatar_url: avatarUrl });
    }

    event.target.value = '';
  };

  const handleRemoveImage = async () => {
    if (user) {
      setSelectedImage(null);
      await updateProfile({ avatar_url: null });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={selectedImage || undefined} alt={userName} />
          <AvatarFallback className={cn(
            "text-2xl font-semibold",
            isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
          )}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute -bottom-2 -right-2">
          <label htmlFor="avatar-upload">
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              style={{ backgroundColor: '#b5103c' }}
              asChild
              disabled={loading}
            >
              <div className="cursor-pointer">
                <Camera size={16} />
              </div>
            </Button>
          </label>
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <label htmlFor="avatar-upload-alt">
          <Button
            variant="outline"
            size="sm"
            style={{
              backgroundColor: 'transparent',
              borderColor: isDarkMode ? '#686868' : '#d1d5db',
              color: isDarkMode ? '#ffffff' : '#374151'
            }}
            asChild
            disabled={loading}
          >
            <div className="cursor-pointer flex items-center space-x-2">
              <Upload size={16} />
              <span>{loading ? 'Enviando...' : 'Alterar'}</span>
            </div>
          </Button>
        </label>
        <Input
          id="avatar-upload-alt"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={loading}
        />
        
        {selectedImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            className="text-red-600 hover:text-red-700"
            style={{
              backgroundColor: 'transparent',
              borderColor: '#dc2626',
              color: '#dc2626'
            }}
            disabled={loading}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};
