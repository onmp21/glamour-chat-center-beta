
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/useUsers';
import { User, UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

interface UserManagementCompactProps {
  isDarkMode: boolean;
}

const AVAILABLE_TABS = [
  'dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'
];

const AVAILABLE_CITIES = [
  'Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  salesperson: 'Vendedor',
  manager_external: 'Gerente Externo',
  manager_store: 'Gerente de Loja',
  manager: 'Gerente'
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total ao sistema',
  salesperson: 'Acesso limitado às vendas',
  manager_external: 'Gerência externa com acesso limitado',
  manager_store: 'Gerência de loja com acesso específico',
  manager: 'Gerência geral'
};

const TAB_PERMISSIONS: Record<UserRole, string[]> = {
  admin: AVAILABLE_TABS,
  salesperson: ['dashboard', 'mensagens', 'exames'],
  manager_external: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager_store: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager: ['dashboard', 'mensagens', 'exames', 'relatorios', 'configuracoes']
};

const CITY_PERMISSIONS: Record<UserRole, string[]> = {
  admin: AVAILABLE_CITIES,
  salesperson: [],
  manager_external: AVAILABLE_CITIES,
  manager_store: [],
  manager: AVAILABLE_CITIES
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
    assignedCities: [] as string[]
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: '', // Don't pre-fill password for security
        name: editingUser.name,
        role: editingUser.role,
        assignedTabs: editingUser.assignedTabs || [],
        assignedCities: editingUser.assignedCities || []
      });
    } else {
      const defaultTabs = TAB_PERMISSIONS['salesperson'] || [];
      const defaultCities = CITY_PERMISSIONS['salesperson'] || [];
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'salesperson',
        assignedTabs: defaultTabs,
        assignedCities: defaultCities
      });
    }
  }, [editingUser]);

  const handleRoleChange = (newRole: UserRole) => {
    const defaultTabs = TAB_PERMISSIONS[newRole] || [];
    const defaultCities = CITY_PERMISSIONS[newRole] || [];
    
    setFormData(prev => ({
      ...prev,
      role: newRole,
      assignedTabs: defaultTabs,
      assignedCities: defaultCities
    }));
  };

  const handleTabChange = (tab: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedTabs: checked 
        ? [...prev.assignedTabs, tab]
        : prev.assignedTabs.filter(t => t !== tab)
    }));
  };

  const handleCityChange = (city: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedCities: checked 
        ? [...prev.assignedCities, city]
        : prev.assignedCities.filter(c => c !== city)
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
        // For updates, only include password if it's provided
        const updateData: any = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
          assignedTabs: formData.assignedTabs,
          assignedCities: formData.assignedCities
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
        await createUser(formData);
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
        assignedCities: CITY_PERMISSIONS['salesperson'] || []
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

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      salesperson: 'bg-blue-100 text-blue-800',
      manager_external: 'bg-purple-100 text-purple-800',
      manager_store: 'bg-green-100 text-green-800',
      manager: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
      </div>
    );
  }

  return (
    <Card className={cn("border shadow-lg", isDarkMode ? "bg-[#1a1a1a] border-[#333333]" : "bg-white border-gray-200")}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg", isDarkMode ? "bg-[#2a2a2a]" : "bg-gray-100")}>
              <Users size={24} className="text-[#b5103c]" />
            </div>
            <div>
              <CardTitle className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Gerencie usuários e suas permissões ({users.length} usuários)
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={() => {
              setEditingUser(null);
              setShowForm(true);
            }}
            className="bg-[#b5103c] hover:bg-[#9a0e35] text-white"
          >
            <Plus size={16} className="mr-2" />
            Novo Usuário
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(isDarkMode ? "bg-[#1a1a1a] border-[#333333] text-white" : "bg-white text-gray-900")}>
                <SelectItem value="all">Todos os papéis</SelectItem>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <SelectItem key={role} value={role}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className={cn("h-12 w-12 mx-auto mb-4", isDarkMode ? "text-gray-400" : "text-gray-400")} />
            <p className={cn("text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              {searchTerm || selectedRole !== 'all' ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
            </p>
            {!searchTerm && selectedRole === 'all' && (
              <Button 
                onClick={() => {
                  setEditingUser(null);
                  setShowForm(true);
                }}
                className="mt-4 bg-[#b5103c] hover:bg-[#9a0e35] text-white"
              >
                Criar Primeiro Usuário
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className={cn(
                "border transition-all duration-200 hover:shadow-md",
                isDarkMode ? "bg-[#2a2a2a] border-[#333333] hover:bg-[#333333]" : "bg-gray-50 border-gray-200 hover:bg-white"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className={cn("font-semibold text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                          {user.name}
                        </h4>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>Usuário:</span>
                          <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                            {user.username}
                          </span>
                        </div>
                        
                        {user.assignedTabs && user.assignedTabs.length > 0 && (
                          <div>
                            <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>Abas:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.assignedTabs.map(tab => (
                                <Badge key={tab} variant="outline" className={cn(
                                  "text-xs",
                                  isDarkMode ? "border-[#444444] text-gray-300" : "border-gray-300"
                                )}>
                                  {tab}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {user.assignedCities && user.assignedCities.length > 0 && (
                          <div>
                            <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>Cidades:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.assignedCities.map(city => (
                                <Badge key={city} variant="outline" className={cn(
                                  "text-xs",
                                  isDarkMode ? "border-[#444444] text-gray-300" : "border-gray-300"
                                )}>
                                  {city}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(user)}
                        className={cn(
                          "transition-colors duration-200",
                          isDarkMode ? "border-[#333333] hover:bg-[#333333] text-white" : "border-gray-300 hover:bg-gray-100"
                        )}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(user.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Form */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className={cn("sm:max-w-md", isDarkMode ? "bg-[#1a1a1a] border-[#333333] text-white" : "bg-white text-gray-900")}>
            <DialogHeader>
              <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome completo do usuário"
                  required
                  className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div>
                <Label htmlFor="username" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="username"
                  required
                  className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div>
                <Label htmlFor="password" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? "Nova senha (opcional)" : "Senha do usuário"}
                    required={!editingUser}
                    className={cn(
                      "pr-10",
                      isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="role" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Papel do Usuário</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(isDarkMode ? "bg-[#1a1a1a] border-[#333333] text-white" : "bg-white text-gray-900")}>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                            {ROLE_DESCRIPTIONS[role as UserRole]}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs Permissions */}
              <div>
                <Label className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Abas Permitidas</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_TABS.map(tab => (
                    <div key={tab} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tab-${tab}`}
                        checked={formData.assignedTabs.includes(tab)}
                        onCheckedChange={(checked) => handleTabChange(tab, !!checked)}
                        className={cn(isDarkMode ? "border-[#444444]" : "border-gray-300")}
                      />
                      <Label 
                        htmlFor={`tab-${tab}`} 
                        className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}
                      >
                        {tab}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cities Permissions */}
              <div>
                <Label className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Cidades Atribuídas</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_CITIES.map(city => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city}`}
                        checked={formData.assignedCities.includes(city)}
                        onCheckedChange={(checked) => handleCityChange(city, !!checked)}
                        className={cn(isDarkMode ? "border-[#444444]" : "border-gray-300")}
                      />
                      <Label 
                        htmlFor={`city-${city}`} 
                        className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}
                      >
                        {city}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  className={cn(isDarkMode ? "border-[#333333] text-white hover:bg-[#2a2a2a]" : "border-gray-300")}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#b5103c] hover:bg-[#9a0e35] text-white">
                  {editingUser ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
