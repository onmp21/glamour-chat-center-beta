import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Users, Plus, Edit, Trash2, Search, UserCheck, UserX, Filter } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import { User, UserRole } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

interface UserManagementSectionProps {
  isDarkMode: boolean;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  isDarkMode
}) => {
  const {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers
  } = useUsers();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  console.log('UserManagementSection - users:', users, 'loading:', loading);

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrador',
      manager_external: 'Gerente Externo',
      manager_store: 'Gerente de Loja',
      salesperson: 'Vendedora'
    };
    return labels[role];
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-red-500 text-white',
      manager_external: 'bg-blue-500 text-white',
      manager_store: 'bg-green-500 text-white',
      salesperson: 'bg-yellow-500 text-white'
    };
    return colors[role];
  };

  // Filtrar usuários baseado na busca e filtro de role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedCities: string[];
  }) => {
    try {
      console.log('Criando usuário através do modal:', userData);
      await createUser(userData);
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso.'
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar usuário. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await updateUser(userId, userData);
      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso.'
      });
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar usuário. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        toast({
          title: 'Sucesso',
          description: 'Usuário excluído com sucesso.'
        });
        setUserToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir usuário. Tente novamente.',
          variant: 'destructive'
        });
      }
    }
  };

  // Recarregar usuários quando o componente for montado
  useEffect(() => {
    refreshUsers();
  }, []);

  if (loading) {
    return (
      <Card className={cn("border shadow-lg")} style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#e5e7eb'
      }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b5103c]"></div>
            <p className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Carregando usuários...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("border shadow-lg")} style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#e5e7eb'
      }}>
        <CardHeader className="pb-4">
          <CardTitle className={cn("flex items-center justify-between", isDarkMode ? "text-white" : "text-gray-900")}>
            <div className="flex items-center space-x-2">
              <Users size={24} className="text-[#b5103c]" />
              <span className="text-xl font-bold">Gerenciamento de Usuários</span>
            </div>
            <Button 
              size="sm" 
              onClick={() => setIsCreateModalOpen(true)} 
              className="bg-[#b5103c] hover:bg-[#9a0e35] text-white transition-colors duration-200"
            >
              <Plus size={16} className="mr-2" />
              Novo Usuário
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className={cn("absolute left-3 top-1/2 transform -translate-y-1/2", isDarkMode ? "text-gray-400" : "text-gray-500")} />
              <Input
                placeholder="Buscar por nome ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("pl-10", isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={18} className={cn(isDarkMode ? "text-gray-400" : "text-gray-500")} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className={cn("px-3 py-2 rounded-md border", isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
              >
                <option value="all">Todos os cargos</option>
                <option value="admin">Administrador</option>
                <option value="manager_external">Gerente Externo</option>
                <option value="manager_store">Gerente de Loja</option>
                <option value="salesperson">Vendedora</option>
              </select>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={cn("p-4 rounded-lg border", isDarkMode ? "bg-[#2a2a2a] border-[#333333]" : "bg-gray-50 border-gray-200")}>
              <div className="flex items-center space-x-2">
                <UserCheck size={20} className="text-green-500" />
                <div>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>Total de Usuários</p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{users.length}</p>
                </div>
              </div>
            </div>
            <div className={cn("p-4 rounded-lg border", isDarkMode ? "bg-[#2a2a2a] border-[#333333]" : "bg-gray-50 border-gray-200")}>
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-blue-500" />
                <div>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>Administradores</p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
            <div className={cn("p-4 rounded-lg border", isDarkMode ? "bg-[#2a2a2a] border-[#333333]" : "bg-gray-50 border-gray-200")}>
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-purple-500" />
                <div>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>Gerentes</p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {users.filter(u => u.role === 'manager_external' || u.role === 'manager_store').length}
                  </p>
                </div>
              </div>
            </div>
            <div className={cn("p-4 rounded-lg border", isDarkMode ? "bg-[#2a2a2a] border-[#333333]" : "bg-gray-50 border-gray-200")}>
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-yellow-500" />
                <div>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>Vendedoras</p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                    {users.filter(u => u.role === 'salesperson').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserX size={48} className={cn("mx-auto mb-4", isDarkMode ? "text-gray-400" : "text-gray-400")} />
                <p className={cn("text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                  {searchTerm || roleFilter !== 'all' ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário encontrado.'}
                </p>
                {(searchTerm || roleFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}
                    className="mt-4"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                    isDarkMode ? "bg-[#2a2a2a] border-[#333333] hover:bg-[#333333]" : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg", getRoleBadgeColor(user.role))}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className={cn("font-semibold text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                        {user.name}
                      </h4>
                      <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                        @{user.username}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className={cn("text-xs font-medium", getRoleBadgeColor(user.role))}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          {user.assignedTabs?.length || 0} canal(is) • {user.assignedCities?.length || 0} cidade(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditUser(user)}
                      className={cn("transition-colors duration-200", isDarkMode ? "border-[#333333] hover:bg-[#333333] text-white" : "border-gray-300 hover:bg-gray-100")}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteUser(user)}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <UserCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreateUser={handleCreateUser} 
        isDarkMode={isDarkMode} 
      />

      <UserEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }} 
        onUpdateUser={handleUpdateUser} 
        user={selectedUser} 
        isDarkMode={isDarkMode} 
      />

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn("p-6 rounded-lg max-w-md w-full mx-4 shadow-xl")} style={{
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#111827'
          }}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
                <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <p className={cn("mb-6", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              Tem certeza que deseja excluir o usuário <strong>"{userToDelete.name}"</strong>? 
              Todos os dados associados a este usuário serão permanentemente removidos.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setUserToDelete(null)}
                className={cn(isDarkMode ? "border-[#333333] text-white hover:bg-[#2a2a2a]" : "border-gray-300")}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
              >
                Excluir Usuário
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

