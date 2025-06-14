import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/useUsers';
import { User, UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { UserManagementHeader } from './user-management/UserManagementHeader';
import { UserCard } from './user-management/UserCard';
import { UserFormModal } from './user-management/UserFormModal';

interface UserManagementCompactProps {
  isDarkMode: boolean;
}

const TAB_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'],
  salesperson: ['dashboard', 'mensagens', 'exames'],
  manager_external: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager_store: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager: ['dashboard', 'mensagens', 'exames', 'relatorios', 'configuracoes']
};

export const UserManagementCompact: React.FC<UserManagementCompactProps> = ({ isDarkMode }) => {
  const { users, loading, createUser, updateUser, deleteUser } = useUsers();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'salesperson' as UserRole,
    assignedTabs: [] as string[],
    assignedChannels: [] as string[],
    assignedSettingsSections: [] as string[]
  });

  // Debug: Log dos usuários recebidos
  useEffect(() => {
    console.log('🔍 [UserManagementCompact] Usuários recebidos:', users);
    console.log('🔍 [UserManagementCompact] Loading:', loading);
    console.log('🔍 [UserManagementCompact] Quantidade:', users.length);
  }, [users, loading]);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: '',
        name: editingUser.name,
        role: editingUser.role,
        assignedTabs: editingUser.assignedTabs || [],
        assignedChannels: editingUser.assignedChannels || [],
        assignedSettingsSections: editingUser.assignedSettingsSections || []
      });
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'salesperson',
        assignedTabs: TAB_PERMISSIONS['salesperson'] || [],
        assignedChannels: [],
        assignedSettingsSections: []
      });
    }
  }, [editingUser]);

  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      assignedTabs: TAB_PERMISSIONS[newRole] || [],
      assignedChannels: [],
      assignedSettingsSections: []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.name || (!editingUser && !formData.password)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingUser) {
        const updateData: any = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
          assignedTabs: formData.assignedTabs,
          assignedChannels: formData.assignedChannels,
          assignedSettingsSections: formData.assignedSettingsSections
        };
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        await updateUser(editingUser.id, updateData);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso"
        });
      } else {
        await createUser({ ...formData }); // assignedChannels agora é o padrão
        toast({
          title: "Sucesso", 
          description: "Usuário criado com sucesso"
        });
      }
      
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'salesperson',
        assignedTabs: TAB_PERMISSIONS['salesperson'] || [],
        assignedChannels: [],
        assignedSettingsSections: []
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar usuário",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(userId);
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao excluir usuário",
          variant: "destructive"
        });
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-6 p-6 rounded-xl",
      isDarkMode ? "bg-[#18181b] border-[#27272a] text-white" : "bg-white border-gray-200"
    )}>
      <UserManagementHeader
        isDarkMode={isDarkMode}
        searchTerm={searchTerm}
        selectedRole={selectedRole}
        onSearchChange={setSearchTerm}
        onRoleChange={setSelectedRole}
        onNewUser={() => {
          setEditingUser(null);
          setShowForm(true);
        }}
      />

      {/* Debug info */}
      <div className={cn(
        "p-4 rounded-lg border",
        isDarkMode ? "bg-[#232327] border-[#27272a]" : "bg-gray-50 border-gray-200"
      )}>
        <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
          Debug: {users.length} usuários carregados | Loading: {loading.toString()}
        </p>
      </div>

      {/* Lista de Usuários */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className={cn("h-12 w-12 mx-auto mb-4", isDarkMode ? "text-gray-400" : "text-gray-400")} />
          <p className={cn("text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>
            {searchTerm || selectedRole !== 'all' ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
          </p>
          <p className={cn("text-sm mt-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
            Total de usuários na base: {users.length}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isDarkMode={isDarkMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <UserFormModal
        open={showForm}
        editingUser={editingUser}
        isDarkMode={isDarkMode}
        formData={formData}
        showPassword={showPassword}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        onShowPasswordToggle={() => setShowPassword(!showPassword)}
      />
    </div>
  );
};
