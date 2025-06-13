
export type UserRole = 'admin' | 'salesperson' | 'manager_external' | 'manager_store' | 'manager';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedTabs: string[];
  assignedCities: string[];
  createdAt: string;
}

export interface DatabaseUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assigned_tabs: string[];
  assigned_cities: string[];
  created_at: string;
  is_active: boolean;
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
