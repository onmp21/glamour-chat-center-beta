
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types/auth';

interface UserFormModalProps {
  open: boolean;
  editingUser: User | null;
  isDarkMode: boolean;
  formData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedChannels: string[];
    assignedSettingsSections: string[];
  };
  showPassword: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: any) => void;
  onShowPasswordToggle: () => void;
}

const AVAILABLE_TABS = [
  'dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'
];

const CHANNEL_OPTIONS = [
  { key: 'canarana', label: 'Canarana' },
  { key: 'souto-soares', label: 'Souto Soares' },
  { key: 'joao-dourado', label: 'João Dourado' },
  { key: 'america-dourada', label: 'América Dourada' },
  { key: 'gerente-lojas', label: 'Gerente Lojas' },
  { key: 'gerente-externo', label: 'Gerente Externo' },
  { key: 'chat', label: 'Chat Geral' }
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

// Reduced settings sections - removed admin-only sections
const SETTINGS_SECTIONS = [
  { key: 'credentials', label: 'Alterar Credenciais' },
  { key: 'notifications', label: 'Configurações de Notificação' },
  { key: 'system', label: 'Sistema' }
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  editingUser,
  isDarkMode,
  formData,
  showPassword,
  onClose,
  onSubmit,
  onFormDataChange,
  onShowPasswordToggle
}) => {
  const handleTabChange = (tab: string, checked: boolean) => {
    onFormDataChange({
      ...formData,
      assignedTabs: checked
        ? [...formData.assignedTabs, tab]
        : formData.assignedTabs.filter(t => t !== tab)
    });
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    onFormDataChange({
      ...formData,
      assignedChannels: checked
        ? [...formData.assignedChannels, channel]
        : formData.assignedChannels.filter(c => c !== channel)
    });
  };

  const handleSettingsSectionChange = (section: string, checked: boolean) => {
    onFormDataChange({
      ...formData,
      assignedSettingsSections: checked
        ? [...(formData.assignedSettingsSections || []), section]
        : (formData.assignedSettingsSections || []).filter(s => s !== section)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-[#1a1a1a] border-[#333333] text-white" : "bg-white text-gray-900")}>
        <DialogHeader>
          <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
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
              onChange={(e) => onFormDataChange({ ...formData, username: e.target.value })}
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
                onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Nova senha (opcional)" : "Senha do usuário"}
                required={!editingUser}
                className={cn("pr-10", isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={onShowPasswordToggle}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="role" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Papel do Usuário</Label>
            <Select value={formData.role} onValueChange={(value: UserRole) => onFormDataChange({ ...formData, role: value })}>
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
          {/* Abas Permitidas */}
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
          {/* Canais atribuídos */}
          <div>
            <Label className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Canais Atribuídos</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CHANNEL_OPTIONS.map(chan => (
                <div key={chan.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`channel-${chan.key}`}
                    checked={formData.assignedChannels.includes(chan.key)}
                    onCheckedChange={(checked) => handleChannelChange(chan.key, !!checked)}
                    className={cn(isDarkMode ? "border-[#8f1440]" : "border-gray-300")}
                  />
                  <Label 
                    htmlFor={`channel-${chan.key}`} 
                    className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}
                  >
                    {chan.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          {/* Seções de Configurações Permitidas - Reduced */}
          <div>
            <Label className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Seções de Configurações Permitidas</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {SETTINGS_SECTIONS.map(sec => (
                <div key={sec.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`settings-section-${sec.key}`}
                    checked={!!(formData.assignedSettingsSections || []).includes(sec.key)}
                    onCheckedChange={(checked) => handleSettingsSectionChange(sec.key, !!checked)}
                    className={cn(isDarkMode ? "border-[#9a0e35]" : "border-gray-300")}
                  />
                  <Label 
                    htmlFor={`settings-section-${sec.key}`} 
                    className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}
                  >
                    {sec.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
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
  );
};
