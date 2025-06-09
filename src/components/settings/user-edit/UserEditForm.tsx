
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface UserEditFormProps {
  formData: {
    username: string;
    password: string;
    name: string;
  };
  onChange: (field: string, value: string) => void;
  isDarkMode: boolean;
}

export const UserEditForm: React.FC<UserEditFormProps> = ({
  formData,
  onChange,
  isDarkMode
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="username" className={cn(
          isDarkMode ? "text-stone-200" : "text-gray-700"
        )}>Nome de Usuário</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => onChange('username', e.target.value)}
          className={cn(
            isDarkMode 
              ? "bg-stone-700 border-stone-600 text-stone-100" 
              : "bg-white border-gray-300"
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={cn(
          isDarkMode ? "text-stone-200" : "text-gray-700"
        )}>Nova Senha</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => onChange('password', e.target.value)}
          placeholder="Deixe em branco para manter a senha atual"
          className={cn(
            isDarkMode 
              ? "bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400" 
              : "bg-white border-gray-300 placeholder:text-gray-500"
          )}
        />
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-stone-400" : "text-gray-500"
        )}>
          Preencha apenas se quiser alterar a senha
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className={cn(
          isDarkMode ? "text-stone-200" : "text-gray-700"
        )}>Nome Completo</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={cn(
            isDarkMode 
              ? "bg-stone-700 border-stone-600 text-stone-100" 
              : "bg-white border-gray-300"
          )}
        />
      </div>
    </>
  );
};
