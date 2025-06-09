
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types/auth';
import { UserEditForm } from './user-edit/UserEditForm';
import { RoleSelector, rolePermissions } from './user-edit/RoleSelector';
import { CityAssignments } from './user-edit/CityAssignments';
import { TabAssignments } from './user-edit/TabAssignments';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (userId: string, userData: Partial<User & { password?: string }>) => void;
  user: User | null;
  isDarkMode: boolean;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  onUpdateUser,
  user,
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

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
        assignedTabs: user.assignedTabs || [],
        assignedCities: user.assignedCities || []
      });
    }
  }, [user]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      assignedTabs: rolePermissions[role] || []
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
    if (user && formData.username && formData.name && formData.role) {
      const updateData: any = {
        username: formData.username,
        name: formData.name,
        role: formData.role,
        assignedTabs: formData.assignedTabs,
        assignedCities: formData.assignedCities
      };
      
      // Só incluir senha se foi fornecida
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      onUpdateUser(user.id, updateData);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md max-h-[90vh] overflow-y-auto",
        isDarkMode ? "bg-stone-800 border-stone-600" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            isDarkMode ? "text-stone-100" : "text-gray-900"
          )}>
            Editar Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <UserEditForm
            formData={{
              username: formData.username,
              password: formData.password,
              name: formData.name
            }}
            onChange={handleFormChange}
            isDarkMode={isDarkMode}
          />

          <RoleSelector
            selectedRole={formData.role}
            onRoleChange={handleRoleChange}
            isDarkMode={isDarkMode}
          />

          <CityAssignments
            assignedCities={formData.assignedCities}
            onCityToggle={handleCityToggle}
            isDarkMode={isDarkMode}
          />

          <TabAssignments
            assignedTabs={formData.assignedTabs}
            userRole={formData.role}
            onTabToggle={handleTabToggle}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            style={{ backgroundColor: '#b5103c', color: 'white' }}
            className="hover:opacity-90"
          >
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
