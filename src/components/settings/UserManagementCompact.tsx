
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, User, Users, Search, RefreshCw } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import { UserRole } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

interface DatabaseUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assigned_tabs: string[];
  assigned_cities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserManagementCompactProps {
  isDarkMode: boolean;
}

export const UserManagementCompact: React.FC<UserManagementCompactProps> = ({
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null);

  const { users, loading, createUser, updateUser, deleteUser, refreshUsers } = useUsers();

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    manager_external: 'Gerente Externo',
    manager_store: 'Gerente de Loja',
    salesperson: 'Vendedora'
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-red-500',
      manager: 'bg-blue-500',
      manager_external: 'bg-green-500',
      manager_store: 'bg-purple-500',
      salesperson: 'bg-orange-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  // Convert users to DatabaseUser format
  const databaseUsers: DatabaseUser[] = users.map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    assigned_tabs: user.assignedTabs || [],
    assigned_cities: user.assignedCities || [],
    is_active: true, // Default to active since the User type doesn't have this field
    created_at: user.createdAt || new Date().toISOString(),
    updated_at: user.updatedAt || new Date().toISOString()
  }));

  const filteredUsers = databaseUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async () => {
    await refreshUsers();
    setIsCreateModalOpen(false);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso",
    });
  };

  const handleUpdateUser = async () => {
    await refreshUsers();
    setIsEditModalOpen(false);
    setSelectedUser(null);
    toast({
      title: "Sucesso",
      description: "Usuário atualizado com sucesso",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(userId);
        await refreshUsers();
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir usuário",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditUser = (user: DatabaseUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#b5103c]" />
            Gerenciamento de Usuários
          </h3>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshUsers}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <User className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-xl font-bold">
                  {databaseUsers.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gerentes</p>
                <p className="text-xl font-bold">
                  {databaseUsers.filter(u => u.role === 'manager' || u.role === 'manager_external' || u.role === 'manager_store').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendedoras</p>
                <p className="text-xl font-bold">
                  {databaseUsers.filter(u => u.role === 'salesperson').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{databaseUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className={cn("text-white", getRoleColor(user.role))}>
                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={cn("text-white", getRoleColor(user.role))}>
                          {roleLabels[user.role]}
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleCreateUser}
      />

      {selectedUser && (
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={handleUpdateUser}
        />
      )}
    </div>
  );
};
