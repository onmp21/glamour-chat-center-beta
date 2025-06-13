import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRole } from '@/types/auth';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const ROLE_TABS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'],
  manager: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager_external: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  manager_store: ['dashboard', 'mensagens', 'exames', 'relatorios'],
  salesperson: ['dashboard', 'mensagens', 'exames']
};

const ROLE_CITIES: Record<UserRole, string[]> = {
  admin: ['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'],
  manager: ['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'],
  manager_external: ['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'],
  manager_store: ['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'],
  salesperson: []
};

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const { createUser } = useUsers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'salesperson' as UserRole,
    assigned_tabs: [] as string[],
    assigned_cities: [] as string[]
  });

  const availableTabs = ['dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'];
  const availableCities = ['Canarana', 'Souto Soares', 'João Dourado', 'América Dourada'];

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    manager_external: 'Gerente Externo',
    manager_store: 'Gerente de Loja',
    salesperson: 'Vendedor'
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      assigned_tabs: ROLE_TABS[role],
      assigned_cities: ROLE_CITIES[role]
    }));
  };

  const handleTabChange = (tab: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assigned_tabs: checked
        ? [...prev.assigned_tabs, tab]
        : prev.assigned_tabs.filter(t => t !== tab)
    }));
  };

  const handleCityChange = (city: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assigned_cities: checked
        ? [...prev.assigned_cities, city]
        : prev.assigned_cities.filter(c => c !== city)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createUser(formData);
      toast.success('Usuário criado com sucesso!');
      onUserCreated();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Nome de usuário"
              required
            />
          </div>

          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Senha"
              required
            />
          </div>

          <div>
            <Label>Função</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key as UserRole}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Permissões</Label>
            <div className="space-y-1">
              {availableTabs.map(tab => (
                <div key={tab} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tab-${tab}`}
                    checked={formData.assigned_tabs.includes(tab)}
                    onCheckedChange={(checked) => handleTabChange(tab, !!checked)}
                  />
                  <Label htmlFor={`tab-${tab}`}>{tab}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Cidades</Label>
            <div className="space-y-1">
              {availableCities.map(city => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox
                    id={`city-${city}`}
                    checked={formData.assigned_cities.includes(city)}
                    onCheckedChange={(checked) => handleCityChange(city, !!checked)}
                  />
                  <Label htmlFor={`city-${city}`}>{city}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
