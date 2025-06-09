import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedCities: string[];
  }) => void;
  isDarkMode: boolean;
}

const availableTabs = [
  { id: 'general', name: 'Canal Geral' },
  { id: 'canarana', name: 'Canarana' },
  { id: 'souto-soares', name: 'Souto Soares' },
  { id: 'joao-dourado', name: 'João Dourado' },
  { id: 'america-dourada', name: 'América Dourada' },
  { id: 'manager-store', name: 'Gerente das Lojas' },
  { id: 'manager-external', name: 'Gerente do Externo' }
];

const availableCities = [
  'Canarana',
  'Souto Soares', 
  'João Dourado',
  'América Dourada'
];

const rolePermissions: Record<UserRole, string[]> = {
  admin: ['general', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'manager-store', 'manager-external'],
  manager_external: ['general', 'manager-external'],
  manager_store: ['general', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'manager-store'],
  salesperson: ['general']
};

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateUser,
  isDarkMode
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: '' as UserRole,
    assignedTabs: [] as string[],
    assignedCities: [] as string[]
  });

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      assignedTabs: rolePermissions[role] || [],
    }));
  };

  const handleTabToggle = (tabId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTabs: prev.assignedTabs.includes(tabId)
        ? prev.assignedTabs.filter(id => id !== tabId)
        : [...prev.assignedTabs, tabId]
    }));
  };

  const handleCityToggle = (cityName: string) => {
    setFormData(prev => ({
      ...prev,
      assignedCities: prev.assignedCities.includes(cityName)
        ? prev.assignedCities.filter(city => city !== cityName)
        : [...prev.assignedCities, cityName]
    }));
  };

  const handleSubmit = () => {
    if (formData.username && formData.password && formData.name && formData.role) {
      onCreateUser(formData);
      setFormData({ username: '', password: '', name: '', role: '' as UserRole, assignedTabs: [], assignedCities: [] });
      onClose();
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrador',
      manager_external: 'Gerente Externo',
      manager_store: 'Gerente de Loja',
      salesperson: 'Vendedora'
    };
    return labels[role];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md max-h-[90vh] overflow-y-auto"
      )} style={{
        backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff',
        borderColor: isDarkMode ? '#686868' : '#e5e7eb'
      }}>
        <DialogHeader>
          <DialogTitle className={cn(
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Criar Novo Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className={cn(
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>Nome de Usuário</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Digite o nome de usuário"
              style={{
                backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                borderColor: isDarkMode ? '#686868' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className={cn(
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Digite a senha"
              style={{
                backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                borderColor: isDarkMode ? '#686868' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className={cn(
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
              style={{
                backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                borderColor: isDarkMode ? '#686868' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className={cn(
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>Função</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger style={{
                backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                borderColor: isDarkMode ? '#686868' : '#d1d5db',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(rolePermissions).map(([role]) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role as UserRole)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.role && (
            <>
              <div className="space-y-2">
                <Label className={cn(
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>Cidades com Acesso</Label>
                <div className="space-y-2 max-h-24 overflow-y-auto border rounded p-2" style={{
                  backgroundColor: isDarkMode ? '#000000' : '#f9f9f9',
                  borderColor: isDarkMode ? '#686868' : '#d1d5db'
                }}>
                  {availableCities.map(city => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city}`}
                        checked={formData.assignedCities.includes(city)}
                        onCheckedChange={() => handleCityToggle(city)}
                      />
                      <Label htmlFor={`city-${city}`} className={cn(
                        "text-sm",
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {city}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>Canais Atribuídos</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2" style={{
                  backgroundColor: isDarkMode ? '#000000' : '#f9f9f9',
                  borderColor: isDarkMode ? '#686868' : '#d1d5db'
                }}>
                  {availableTabs.map(tab => (
                    <div key={tab.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tab.id}
                        checked={formData.assignedTabs.includes(tab.id)}
                        onCheckedChange={() => handleTabToggle(tab.id)}
                        disabled={formData.role !== 'admin' && !rolePermissions[formData.role]?.includes(tab.id)}
                      />
                      <Label htmlFor={tab.id} className={cn(
                        "text-sm",
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {tab.name}
                        {tab.id === 'general' && (
                          <span className={cn(
                            "text-xs ml-2",
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          )}>
                            (Somente admin pode enviar mensagens)
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              borderColor: isDarkMode ? '#686868' : '#d1d5db',
              color: isDarkMode ? '#ffffff' : '#374151'
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.username || !formData.password || !formData.name || !formData.role}
            style={{
              backgroundColor: '#b5103c',
              color: '#ffffff'
            }}
            className="hover:opacity-90"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
