
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

// Adaptação dos canais disponíveis para visualização no cadastro (BASE SIMPLIFICADA)
const AVAILABLE_CHANNELS = [
  { key: 'canarana', label: 'Canarana' },
  { key: 'souto-soares', label: 'Souto Soares' },
  { key: 'joao-dourado', label: 'João Dourado' },
  { key: 'america-dourada', label: 'América Dourada' },
  { key: 'gerente-lojas', label: 'Gerente Lojas' },
  { key: 'gerente-externo', label: 'Gerente Externo' },
  { key: 'chat', label: 'Chat Geral' }
];

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
    assignedTabs: ROLE_TABS['salesperson'],
    assignedChannels: [] as string[]
  });

  const availableTabs = ['dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'];

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
      assignedTabs: ROLE_TABS[role],
      assignedChannels: []
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

  const handleChannelChange = (channel: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedChannels: checked
        ? [...prev.assignedChannels, channel]
        : prev.assignedChannels.filter(c => c !== channel)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createUser({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        assignedTabs: formData.assignedTabs,
        assignedChannels: formData.assignedChannels
      });
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
            <Label>Permissões: Abas Permitidas</Label>
            <div className="space-y-1">
              {availableTabs.map(tab => (
                <div key={tab} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tab-${tab}`}
                    checked={formData.assignedTabs.includes(tab)}
                    onCheckedChange={(checked) => handleTabChange(tab, !!checked)}
                  />
                  <Label htmlFor={`tab-${tab}`}>{tab}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Canais</Label>
            <div className="space-y-1">
              {AVAILABLE_CHANNELS.map(channel => (
                <div key={channel.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`channel-${channel.key}`}
                    checked={formData.assignedChannels.includes(channel.key)}
                    onCheckedChange={(checked) => handleChannelChange(channel.key, !!checked)}
                  />
                  <Label htmlFor={`channel-${channel.key}`}>{channel.label}</Label>
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
