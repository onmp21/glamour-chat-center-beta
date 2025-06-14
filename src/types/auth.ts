
// Atualização do tipo de usuário e a interface DatabaseUser para refletir a nova estrutura.

export type UserRole = 'admin' | 'salesperson' | 'manager_external' | 'manager_store' | 'manager';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedTabs: string[];
  assignedChannels: string[];
  assignedSettingsSections?: string[]; // <-- Novo campo
  createdAt: string;
}

export interface DatabaseUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assigned_tabs: string[];
  assigned_channels: string[];
  assigned_settings_sections?: string[]; // <-- Novo campo
  is_active: boolean;
  created_at: string;
  updated_at: string;
  password_hash: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading?: boolean;
}
