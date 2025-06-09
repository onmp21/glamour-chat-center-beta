
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Users, Plus, Edit, Trash2, Search, UserCheck, Shield, UserCog, Store } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import { User, UserRole } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

interface UserManagementCompactProps {
  isDarkMode: boolean;
}

export const UserManagementCompact: React.FC<UserManagementCompactProps> = ({
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
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Admin',
      manager_external: 'Gerente Ext.',
      manager_store: 'Gerente Loja',
      salesperson: 'Vendedora'
    };
    return labels[role];
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'manager_external':
        return UserCog;
      case 'manager_store':
        return Store;
      case 'salesperson':
        return UserCheck;
      default:
        return UserCheck;
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager_external' || u.role === 'manager_store').length,
    salespersons: users.filter(u => u.role === 'salesperson').length
  };

  const handleCreateUser = async (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedCities: string[];
  }) => {
    try {
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

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      try {
        await deleteUser(user.id);
        toast({
          title: 'Sucesso',
          description: 'Usuário excluído com sucesso.'
        });
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

  useEffect(() => {
    refreshUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <UserCog className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.managers}</p>
                  <p className="text-sm text-muted-foreground">Gerentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.salespersons}</p>
                  <p className="text-sm text-muted-foreground">Vendedoras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Lista de Usuários */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </div>
              ) : (
                filteredUsers.map(user => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <RoleIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(user.role)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </>
  );
};
