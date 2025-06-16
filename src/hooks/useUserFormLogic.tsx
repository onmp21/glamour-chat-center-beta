
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types/auth';

const TAB_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'],
  salesperson: ['dashboard', 'mensagens', 'exames'],
  manager_external: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager_store: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager: ['dashboard', 'mensagens', 'exames', 'relatorios', 'configuracoes']
};

export const useUserFormLogic = (editingUser: User | null) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'salesperson' as UserRole,
    assignedTabs: [] as string[],
    assignedChannels: [] as string[]
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: '',
        name: editingUser.name,
        role: editingUser.role,
        assignedTabs: editingUser.assignedTabs || [],
        assignedChannels: editingUser.assignedChannels || []
      });
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'salesperson',
        assignedTabs: TAB_PERMISSIONS['salesperson'] || [],
        assignedChannels: []
      });
    }
  }, [editingUser]);

  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      assignedTabs: TAB_PERMISSIONS[newRole] || [],
      assignedChannels: [] // Limpa canais ao trocar
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'salesperson',
      assignedTabs: TAB_PERMISSIONS['salesperson'] || [],
      assignedChannels: []
    });
  };

  return {
    formData,
    setFormData,
    handleRoleChange,
    resetForm
  };
};
